import Peer from 'simple-peer';
import EventEmitter from 'eventemitter3';
import socket from '../socket/index';

/**
 * @returns { Promise<MediaStream>}
 */
const getUserMedia = () => new Promise((resolve, reject) => {
  window.navigator.getUserMedia = (window.navigator.getUserMedia
    || window.navigator.webkitGetUserMedia
    || window.navigator.mozGetUserMedia
    || window.navigator.msGetUserMedia);
  window.navigator.getUserMedia({ video: true, audio: true }, (stream) => {
    resolve(stream);
  }, (error) => {
    reject(error);
  });
});

/**
 * @returns { Promise<MediaStream>}
 */
const getDisplayMedia = () => {
  const displayStream = navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
  return displayStream;
};

export default class PeerClient extends EventEmitter {
  constructor({ room, username }) {
    super();
    this.room = room;
    this.username = username;
    socket.addEventListener('rtc-signal', this.handleSignaling);
    this.getCameraStream();
  }

  getCameraStream = async () => {
    try {
      if (!this.cameraStream) {
        this.cameraStream = await getUserMedia();
        this.cameraStream.name = 'camera';
        this.emit('ready');
        this.emit('local-camera-stream', this.cameraStream);
      }
      return this.cameraStream;
    } catch (error) {
      this.emit('error', 'Can not access camera');
      return null;
    }
  }

  handleSignaling = (data) => {
    if (data.room === this.room && data.from !== this.username) {
      this.peer.signal(data.signal);
    }
  }

  startCall = ({ initiator }) => {
    this.destroyOldPeer();
    this.peer = new Peer({ initiator });
    this.peer.on('signal', (signal) => {
      socket.emit('rtc-signal', {
        room: this.room,
        from: this.username,
        signal,
      });
    });

    this.peer.on('connect', async () => {
      this.emit('connect');
      if (this.cameraStream) {
        this.peer.addStream(this.cameraStream);
        if (this.screenStream) {
          this.peer.addStream(this.screenStream);
        }
      }
    });

    this.peer.on('data', (data) => {
      const str = data.toString();
      if (str === 'remote-screen-stream-ended') {
        this.emit('remote-screen-stream-ended');
      } else {
        this.emit('data', str);
      }
    });

    this.peer.on('stream', (stream) => {
      if (!this.remoteCameraStream) {
        this.remoteCameraStream = stream;
        this.emit('remote-camera-stream', stream);
      } else {
        this.remoteScreenStream = stream;
        this.emit('remote-screen-stream', stream);
      }
    });
  }

  send = (data) => {
    this.peer.send(data);
  }

  mute = (enabled) => {
    const audioTrack = this.cameraStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = enabled;
    }
  }

  enableVideo = (enabled) => {
    const videoTrack = this.cameraStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = enabled;
    }
  }

  toggleShareScreen = async () => {
    try {
      if (this.screenStream) {
        this.screenStream.getTracks().forEach((x) => x.stop());
        this.emit('local-screen-stream-ended');
        this.peer.send('remote-screen-stream-ended');
        this.screenStream = null;
      } else {
        const screenStream = await getDisplayMedia();
        this.screenStream = screenStream;
        screenStream.getTracks()[0].addEventListener('ended', () => {
          this.screenStream = null;
          this.emit('local-screen-stream-ended');
          this.peer.send('remote-screen-stream-ended');
        });
        this.emit('local-screen-stream', screenStream);
        if (this.peer) {
          this.peer.addStream(screenStream);
        }
      }
    } catch (error) {
      this.emit('error', 'Can not access display');
    }
  }

  destroy = () => {
    this.destroyOldPeer();
    socket.removeAllListeners('rtc-signal', this.handleSignaling);
  }

  destroyOldPeer = () => {
    if (this.peer) {
      this.peer.destroy();
    }
  }

  static isSupported = () => Peer.WEBRTC_SUPPORT;
}
