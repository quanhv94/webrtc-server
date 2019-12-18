import Peer from 'simple-peer';
import EventEmitter from 'eventemitter3';
import socket from '../socket/index';
import LocalStorage from './LocalStorage';

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

class PeerClient extends EventEmitter {
  constructor({ domain, token, roomCode, role }) {
    super();
    if (!domain || !token || !roomCode) return;
    this.roomCode = roomCode;
    this.cameraOn = true;
    this.microphoneOn = true;
    socket.addEventListener('rtc-signal', (data) => {
      if (data.senderId !== this.user.user_id) {
        this.peer.signal(data.signal);
      }
    });
    socket.emit('join', { domain, token, roomCode, role });
    socket.once('join-success', ({ user, room, storageConfig, chatRoomConfig, currentTime }) => {
      this.emit('join-success', { user, room, storageConfig, chatRoomConfig, currentTime });
      this.user = user;
      this.room = room;
      this.storageConfig = storageConfig;
      this.chatRoomConfig = chatRoomConfig;
      this.getCameraStream();
      console.log(room);
    });
    socket.on('partner-leave', () => {
      this.remoteCameraStream = null;
      this.remoteScreenStream = null;
      this.destroyOldPeer();
      this.emit('partner-leave');
      this.playSoundEffect('leave');
    });
    socket.on('partner-join', (partner) => {
      this.emit('partner-join', partner);
      this.playSoundEffect('join');
    });
    socket.on('make-peer', ({ callerId }) => {
      this.makePeer({ initiator: callerId === this.user.user_id });
    });
    socket.on('join-error', (error) => {
      this.emit('join-error', error);
    });
    socket.on('toast', (message) => {
      this.emit('toast', message);
    });
    socket.on('chat-message', (messages) => {
      this.emit('chat-message', messages);
    });
    socket.on('disconnect', () => {
      this.emit('join-error', 'Disconnected');
    });
  }

  playSoundEffect = (name) => {
    console.log(`Play sound: ${name}`);
    const audio = new Audio();
    audio.src = `/audio/${name}.mp3`;
    audio.play();
  }

  getCameraStream = async () => {
    try {
      if (!this.localCameraStream) {
        this.localCameraStream = await getUserMedia();
        this.emit('ready');
        this.emit('local-camera-stream', this.localCameraStream);
        const userConfig = LocalStorage.loadUserConfig(this.user.user_id);
        if (userConfig) {
          this.localCameraStream.getVideoTracks()[0].enabled = userConfig.cameraOn;
          this.cameraOn = userConfig.cameraOn;
          this.localCameraStream.getAudioTracks()[0].enabled = userConfig.microphoneOn;
          this.microphoneOn = userConfig.microphoneOn;
        }
      }
      return this.localCameraStream;
    } catch (error) {
      this.emit('toast', { type: 'error', content: 'Can not access camera' });
      return null;
    }
  }

  makePeer = ({ initiator }) => {
    this.destroyOldPeer();
    this.peer = new Peer({
      initiator,
      config: {
        iceServers,
      },
    });
    this.peer.on('signal', (signal) => {
      socket.emit('rtc-signal', {
        roomCode: this.roomCode,
        senderId: this.user.user_id,
        signal,
      });
    });

    this.peer.on('connect', async () => {
      if (this.localCameraStream) {
        this.peer.addStream(this.localCameraStream);
        if (this.localScreenStream) {
          this.peer.addStream(this.localScreenStream);
        }
      }
      this.send('greeting from your partner');
      this.sendConfig();
    });

    this.peer.on('data', (data) => {
      const str = data.toString();
      if (str === 'remote-screen-stream-ended') {
        this.emit('remote-screen-stream-ended');
      } else if (str === 'remote-camera-on') {
        this.emit('remote-camera-on');
      } else if (str === 'remote-camera-off') {
        this.emit('remote-camera-off');
      } else if (str === 'remote-microphone-on') {
        this.emit('remote-microphone-on');
      } else if (str === 'remote-microphone-off') {
        this.emit('remote-microphone-off');
      } else {
        this.emit('data', str);
      }
      console.log('--on data--', str);
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

  enableAudio = (enabled) => {
    this.microphoneOn = enabled;
    const audioTrack = this.localCameraStream.getAudioTracks()[0];
    if (audioTrack) {
      this.sendConfig();
      audioTrack.enabled = enabled;
    }
    this.sendMessage(`${this.user.full_name} turn ${enabled ? 'on' : 'off'} microphone`, 'LOG');
  }

  enableVideo = (enabled) => {
    this.cameraOn = enabled;
    const videoTrack = this.localCameraStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = enabled;
      this.sendConfig();
    }
    this.sendMessage(`${this.user.full_name} turn ${enabled ? 'on' : 'off'} camera`, 'LOG');
  }

  requestShareScreen = async () => {
    try {
      const localScreenStream = await getDisplayMedia();
      this.localScreenStream = localScreenStream;
      localScreenStream.getTracks()[0].addEventListener('ended', this.removeShareScreen);
      this.emit('local-screen-stream', localScreenStream);
      if (this.peer) {
        this.peer.addStream(localScreenStream);
      }
      this.sendMessage(`${this.user.full_name} start share screen`, 'LOG');
    } catch (error) {
      this.emit('toast', { type: 'error', content: 'Can not access display' });
    }
  }

  removeShareScreen = () => {
    this.localScreenStream.getTracks().forEach((x) => x.stop());
    this.emit('local-screen-stream-ended');
    this.send('remote-screen-stream-ended');
    this.localScreenStream = null;
    this.sendMessage(`${this.user.full_name} stop share screen`, 'LOG');
  }

  requestRecordScreenStream = async () => {
    try {
      const recordScreenStream = await getDisplayMedia();
      recordScreenStream.addTrack(this.localCameraStream.getAudioTracks()[0]);
      this.recordScreenStream = recordScreenStream;
      return recordScreenStream;
    } catch (error) {
      console.log(error);
      this.emit('message', { type: 'error', content: 'Can not access display' });
      return null;
    }
  }

  removeRecordScreenStream = () => {
    if (this.recordScreenStream) {
      this.recordScreenStream.getTracks().forEach((x) => x.stop());
      this.recordScreenStream = null;
    }
  }

  sendConfig = () => {
    this.send(`remote-camera-${this.cameraOn ? 'on' : 'off'}`);
    this.send(`remote-microphone-${this.microphoneOn ? 'on' : 'off'}`);
  }

  sendMessage = (content, type = 'TEXT') => {
    socket.emit('chat-message', {
      type,
      content,
    });
  }

  destroy = () => {
    this.destroyOldPeer();
    socket.emit('leave');
    socket.removeAllListeners();
  }

  destroyOldPeer = () => {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }

  static isSupported = () => Peer.WEBRTC_SUPPORT;
}

const { pathname } = window.location;
const params = pathname.split('/');
const peerClient = new PeerClient({
  domain: window.atob(params[1]),
  token: params[2],
  roomCode: params[3],
  role: params[4],
});

export default peerClient;
