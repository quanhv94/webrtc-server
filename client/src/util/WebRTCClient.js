import Peer from 'simple-peer';
import EventEmitter from 'eventemitter3';
import socket from '../socket/index';

const iceServers = [
  {
    url: 'turn:numb.viagenie.ca',
    credential: 'muazkh',
    username: 'webrtc@live.com',
  },
  {
    url: 'turn:192.158.29.39:3478?transport=udp',
    credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    username: '28224511:1379330808',
  },
  {
    url: 'turn:192.158.29.39:3478?transport=tcp',
    credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    username: '28224511:1379330808',
  },
  {
    url: 'turn:turn.bistri.com:80',
    credential: 'homeo',
    username: 'homeo',
  },
  {
    url: 'turn:turn.anyfirewall.com:443?transport=tcp',
    credential: 'webrtc',
    username: 'webrtc',
  },
];

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
      if (!this.localCameraStream) {
        this.localCameraStream = await getUserMedia();
        this.localCameraStream.name = 'camera';
        this.emit('ready');
        this.emit('local-camera-stream', this.localCameraStream);
      }
      return this.localCameraStream;
    } catch (error) {
      console.log(error);
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
    this.peer = new Peer({
      initiator,
      config: {
        iceServers,
      },
    });
    this.peer.on('signal', (signal) => {
      socket.emit('rtc-signal', {
        room: this.room,
        from: this.username,
        signal,
      });
    });

    this.peer.on('connect', async () => {
      this.emit('connect');
      if (this.localCameraStream) {
        this.peer.addStream(this.localCameraStream);
        if (this.localScreenStream) {
          this.peer.addStream(this.localScreenStream);
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
    if (this.peer) {
      this.peer.send(data);
    }
  }

  mute = (enabled) => {
    const audioTrack = this.localCameraStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = enabled;
    }
  }

  enableVideo = (enabled) => {
    const videoTrack = this.localCameraStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = enabled;
    }
  }

  toggleShareScreen = async () => {
    try {
      if (this.localScreenStream) {
        this.localScreenStream.getTracks().forEach((x) => x.stop());
        this.emit('local-screen-stream-ended');
        this.send('remote-screen-stream-ended');
        this.localScreenStream = null;
      } else {
        const localScreenStream = await getDisplayMedia();
        this.localScreenStream = localScreenStream;
        localScreenStream.getTracks()[0].addEventListener('ended', () => {
          this.localScreenStream = null;
          this.emit('local-screen-stream-ended');
          this.send('remote-screen-stream-ended');
        });
        this.emit('local-screen-stream', localScreenStream);
        if (this.peer) {
          this.peer.addStream(localScreenStream);
        }
      }
    } catch (error) {
      console.log(error);
      this.emit('error', 'Can not access display');
    }
  }

  requestRecordScreenStream = async () => {
    try {
      const recordScreenStream = await getDisplayMedia();
      recordScreenStream.addTrack(this.localCameraStream.getAudioTracks()[0]);
      this.recordScreenStream = recordScreenStream;
      return recordScreenStream;
    } catch (error) {
      console.log(error);
      this.emit('error', 'Can not access display');
      return null;
    }
  }

  removeRecordScreenStream = () => {
    if (this.recordScreenStream) {
      this.recordScreenStream.getTracks().forEach((x) => x.stop());
      this.recordScreenStream = null;
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
