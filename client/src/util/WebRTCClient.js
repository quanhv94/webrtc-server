/* eslint-disable lines-between-class-members */
import Peer from 'simple-peer';
import EventEmitter from 'eventemitter3';
import firebase from 'firebase/app';
import qs from 'qs';
import 'firebase/database';
import axios from 'axios';
import { RecordRTCPromisesHandler, invokeSaveAsDialog } from 'recordrtc';
import _ from 'lodash';
import uuid from 'uuid/v4';
import moment from 'moment';
import socket from '../socket/index';
import LocalStorage from './LocalStorage';
import Constants from '../config/constants';

const SCREEN_RECORD_TIME_LIMIT = 10 * 60 * 1000; // 10 minutes

const isTeacherOrStudent = (user) => (user.role && ['TEACHER', 'STUDENT'].includes(user.role));

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
  const displayStream = navigator.mediaDevices.getDisplayMedia({ video: true });
  return displayStream;
};

class PeerClient extends EventEmitter {
  constructor({ domain, token, roomCode, role }) {
    super();
    if (!domain || !token || !roomCode || !role) return;
    this.data = {
      roomCode,
      cameraOn: true,
      microphoneOn: true,
      screenRecordFileQueue: [],
      peers: [],
    };
    socket.on('rtc-signal', ({ sender, receiver, signal }) => {
      if (receiver.socketId === socket.id) {
        this.getPeerByReceiverSocketId(sender.socketId).signal(signal);
      }
    });
    socket.emit('join', { domain, token, roomCode, role });
    socket.once('join-success', async ({ user, roomDetail, storageConfig, chatRoomConfig, toolConfig, currentTime, teacher, student }) => {
      this.emit('join-success', { user, roomDetail, storageConfig, chatRoomConfig, toolConfig, currentTime });
      this.emit('teacher-info', teacher);
      this.emit('student-info', student);
      this.setUser(user);
      this.setRoom(roomDetail);
      if (isTeacherOrStudent(user)) {
        this.requestCameraStream();
      } else {
        this.emit('ready');
      }
      this.setStorageConfig(storageConfig);
      this.setChatRoomConfig(chatRoomConfig);
      this.setToolConfig(toolConfig);
      this.initFirebaseChat();
      this.initFirebaseNote();
      this.sendMessage({
        content: `${this.getUser().full_name} joined`,
        type: 'LOG',
      });
      socket.on('leave', ({ leaverSocketId }) => {
        this.removePeerByReceiverSocketId(leaverSocketId);
      });
      socket.on('partner-joined', (partner) => {
        this.emit('partner-joined', partner);
        this.playSoundEffect('join');
      });
      socket.on('partner-left', () => {
        this.emit('partner-left');
        this.playSoundEffect('leave');
      });
      socket.on('make-peer', ({ initiatorSocketId, users }) => {
        this.makePeers({ initiatorSocketId, users });
      });
      socket.on('toast', (message) => {
        this.emit('toast', message);
      });
      socket.on('turn-camera', ({ userId, status }) => {
        this.emit('turn-camera', { userId, status });
      });
      socket.on('turn-microphone', ({ userId, status }) => {
        this.emit('turn-microphone', { userId, status });
      });
      socket.on('screen-stream-ended', ({ userId }) => {
        this.emit('screen-stream-ended', { userId });
      });
    });
    socket.on('join-error', (error) => {
      this.emit('join-error', error);
    });
    socket.on('disconnect', () => {
      this.emit('join-error', 'Disconnected');
    });
  }

  setUser = (user) => { this.data.user = user; };
  getUser = () => this.data.user;

  setRoomCode = (roomCode) => { this.data.roomCode = roomCode; };
  getRoomCode = () => this.data.roomCode;

  setRoom = (room) => { this.data.room = room; }
  getRoom = () => this.data.room;

  addPeer = (peer) => { this.data.peers.push(peer); }
  /** @returns {Array<Peer.Instance>} */
  getPeers = () => this.data.peers;

  /** @returns {Peer.Instance} */
  getPeerByReceiverSocketId = (receiverSocketId) => {
    const peers = this.getPeers();
    return _.find(peers, (x) => x.receiverSocketId === receiverSocketId);
  }
  removePeerByReceiverSocketId = (receiverSocketId) => {
    const peer = this.getPeerByReceiverSocketId(receiverSocketId);
    if (!peer) return;
    if (!peer.destroyed) peer.destroy();
    const peers = this.getPeers();
    this.data.peers = peers.filter((x) => x.receiverSocketId !== receiverSocketId);
  }
  removeAllPeers = () => {
    this.getPeers()
      .forEach((x) => this.removePeerByReceiverSocketId(x.receiverSocketId));
  };

  setStorageConfig = (storageConfig) => { this.data.storageConfig = storageConfig; }
  getStorageConfig = () => this.data.storageConfig;

  setChatRoomConfig = (chatRoomConfig) => { this.data.chatRoomConfig = chatRoomConfig; }
  getChatRoomConfig = () => this.data.chatRoomConfig;

  setToolConfig = (toolConfig) => { this.data.toolConfig = toolConfig; }
  getToolConfig = () => this.data.toolConfig;

  setFirebaseChatDatabase = (firebaseChatDatabase) => {
    this.data.firebaseChatDatabase = firebaseChatDatabase;
  }
  /** @returns {firebase.database.Database} */
  getFirebaseChatDatabase = () => this.data.firebaseChatDatabase;

  setFirebaseNoteDatabase = (firebaseNoteDatabase) => {
    this.data.firebaseNoteDatabase = firebaseNoteDatabase;
  }
  /** @returns {firebase.database.Database} */
  getFirebaseNoteDatabase = () => this.data.firebaseNoteDatabase;

  // local
  setLocalCameraStream = (localCameraStream) => { this.data.localCameraStream = localCameraStream; }
  /** @returns {MediaStream} */
  getLocalCameraStream = () => this.data.localCameraStream;

  setLocalScreenStream = (localScreenStream) => { this.data.localScreenStream = localScreenStream; }
  /** @returns {MediaStream} */
  getLocalScreenStream = () => this.data.localScreenStream;

  setRecordScreenStream = (recordScreenStream) => {
    this.data.recordScreenStream = recordScreenStream;
  }
  /** @returns {MediaStream} */
  getRecordScreenStream = () => this.data.recordScreenStream;

  // remote
  setRemoteCameraStream = (remoteCameraStream) => {
    this.data.remoteCameraStream = remoteCameraStream;
  }
  /** @returns {MediaStream} */
  getRemoteCameraStream = () => this.data.remoteCameraStream;

  setRemoteScreenStream = (remoteScreenStream) => {
    this.data.remoteScreenStream = remoteScreenStream;
  }
  /** @returns {MediaStream} */
  getRemoteScreenStream = () => this.data.remoteScreenStream;

  setRecordScreenStream = (recordScreenStream) => {
    this.data.recordScreenStream = recordScreenStream;
  }
  /** @returns {MediaStream} */
  getRecordScreenStream = () => this.data.recordScreenStream;

  setCameraStatus = (enabled) => { this.data.cameraOn = enabled; }
  isCameraOn = () => this.data.cameraOn;

  setMicrophoneStatus = (enabled) => { this.data.microphoneOn = enabled; }
  isMicrophoneOn = () => this.data.microphoneOn;

  setScreenRecorder = (recorder) => { this.data.screenRecorder = recorder; }
  getScreenRecorder = () => this.data.screenRecorder;

  getSreenRecordFileQueue = () => this.data.screenRecordFileQueue;
  addFileToSreenRecordFileQueue = (file) => this.data.screenRecordFileQueue.push(file);
  removeFileFromScreenRecordFileQueue = (fileId) => {
    const queue = this.getSreenRecordFileQueue();
    this.data.screenRecordFileQueue = queue.filter((x) => x.id !== fileId);
  }
  isScreenRecordFileQueueEmpty = () => _.isEmpty(this.data.screenRecordFileQueue);

  isOutOfTime = () => {
    const room = this.getRoom();
    const endingTime = moment(room.plan_start_datetime).add(room.plan_duration, 'minute');
    return moment().diff(moment(endingTime), 'second') > 0;
  }

  initFirebaseChat = () => {
    const chatRoomConfig = this.getChatRoomConfig();
    const database = firebase.initializeApp(chatRoomConfig.firebase, 'chat').database();
    this.setFirebaseChatDatabase(database);
    // const userInboxRef = firebase.database().ref(this.chatRoomConfig.sender.userInboxRef);
    // userInboxRef.on('value', (snapshot) => {
    //   this.emit('chat-total-unread', _.get(snapshot.val(), 'totalUnread', 0));
    // });

    const roomMessageRef = database.ref(chatRoomConfig.roomMessageRef);

    // get last 500 messages
    roomMessageRef.limitToLast(500).once('value', (snapshot) => {
      let messages = snapshot.val();
      if (!messages) return;
      messages = Object.keys(messages).map((id) => ({
        id,
        ...messages[id],
      }));
      this.emit('chat-message', messages);
    });

    // listen for new message
    let childAddedFlag = true;
    roomMessageRef.limitToLast(1).on('child_added', (snapshot) => {
      if (childAddedFlag === true) {
        childAddedFlag = false;
        return;
      }
      const message = snapshot.val();
      message.id = snapshot.key;
      this.emit('chat-message', message);
    });
  }

  sendMessage = ({ content = '', type = 'TEXT', file = null }) => {
    if (!isTeacherOrStudent(this.getUser())) {
      this.log('Only teacher and student can send message');
      return;
    }
    if (type === 'LOG' && process.env.NODE_ENV === 'development') {
      this.log('LOG message', content);
      return;
    }
    const chatRoomConfig = this.getChatRoomConfig();
    const database = this.getFirebaseChatDatabase();
    const roomMessageRef = database.ref(chatRoomConfig.roomMessageRef);
    roomMessageRef.push({
      sender: chatRoomConfig.sender,
      type,
      content,
      file,
      sentAt: moment().format(),
    });

    // Increase totalUnread of others members;
    // chatRoomConfig.roomMembers.forEach((member) => {
    //   if (member.user_id === this.getUser().user_id) return;
    //   const ref = database.ref(member.userInboxRef);
    //   ref.child('/totalUnread').once('value', (snapshot) => {
    //     const totalUnread = snapshot.val() || 0;
    //     ref.update({
    //       totalUnread: totalUnread + 1,
    //       updatedAt: moment().format(),
    //     });
    //   });
    // });
  }

  resetTotalUnread = () => {
    // const database = this.getFirebaseChatDatabase();
    // database.ref(this.chatRoomConfig.sender.userInboxRef).update({
    //   updatedAt: moment().format(),
    //   totalUnread: 0,
    // });
  }

  initFirebaseNote = async () => {
    const { REALTIME_NOTE } = this.getToolConfig();
    const database = firebase.initializeApp(REALTIME_NOTE.firebase, 'note').database();
    this.setFirebaseNoteDatabase(database);
    const { noteRefs } = REALTIME_NOTE;
    this.emit('set-notes', noteRefs);
    noteRefs.forEach((noteRef) => {
      const ref = database.ref(noteRef.noteRef);
      ref.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && _.isString(data.content)) {
          this.emit('update-note', { userId: noteRef.userId, content: data.content });
        }
      });
    });
  }

  updateNoteContent = (content) => {
    const { REALTIME_NOTE } = this.getToolConfig();
    const { noteRefs } = REALTIME_NOTE;
    const noteRef = _.find(noteRefs, (x) => x.userId === this.getUser().user_id);
    if (noteRef) {
      const ref = this.getFirebaseNoteDatabase().ref(noteRef.noteRef);
      ref.update({ content });
    }
  }

  playSoundEffect = (name) => {
    this.log(`Play sound: ${name}`);
    const audio = new Audio();
    audio.src = `/audio/${name}.mp3`;
    audio.play();
  }

  requestCameraStream = async () => {
    try {
      const localCameraStream = await getUserMedia();
      this.setLocalCameraStream(localCameraStream);
      this.emit('ready');
      this.emit('camera-stream', {
        user: this.getUser(),
        stream: localCameraStream,
      });
      const userConfig = LocalStorage.loadUserConfig(this.getUser().user_id);
      if (userConfig) {
        localCameraStream.getVideoTracks()[0].enabled = userConfig.cameraOn;
        this.setCameraStatus(userConfig.cameraOn);
        localCameraStream.getAudioTracks()[0].enabled = userConfig.microphoneOn;
        this.setMicrophoneStatus(userConfig.microphoneOn);
      }
      this.getPeers().forEach((peer) => {
        peer.addedStreamFlag = true;
        peer.addStream(localCameraStream);
      });
      return localCameraStream;
    } catch (error) {
      this.emit('toast', { type: 'error', content: 'Can not access camera' });
      return null;
    }
  }

  makePeers = ({ initiatorSocketId, users }) => {
    users.forEach((receiver) => {
      // check if not itself and not connected
      if (receiver.socketId !== socket.id && !this.getPeerByReceiverSocketId(receiver.socketId)) {
        this.makePeer({ initiatorSocketId, receiver });
      }
    });
  }

  makePeer = ({ initiatorSocketId, receiver }) => {
    const peer = new Peer({
      initiator: initiatorSocketId === socket.id,
      config: {
        iceServers: Constants.iceServers,
      },
    });
    peer.receiverSocketId = receiver.socketId;
    peer.receiver = receiver;
    peer.on('signal', (signal) => {
      socket.emit('rtc-signal', {
        roomCode: this.roomCode,
        sender: this.getUser(),
        receiver,
        signal,
      });
    });

    peer.on('connect', async () => {
      if (this.getLocalCameraStream() && !peer.addedStreamFlag) {
        peer.addStream(this.getLocalCameraStream());
        peer.addedStreamFlag = true;
      }
      if (this.getLocalScreenStream()) {
        peer.addStream(this.getLocalScreenStream());
      }
      this.sendAllConfig();
    });

    peer.on('data', (data) => {
      const str = data.toString();
      this.log('--on data--', str);
    });

    peer.on('stream', (stream) => {
      if (!this.getRemoteCameraStream()) {
        this.setRemoteCameraStream(stream);
        this.emit('camera-stream', { stream, user: peer.receiver });
        if (this.getRecordScreenStream()) {
          this.getRecordScreenStream().addTrack(stream.getAudioTracks()[0]);
        }
      } else {
        this.setRemoteScreenStream(stream);
        this.emit('screen-stream', { stream, user: peer.receiver });
      }
    });
    this.addPeer(peer);
  }

  enableAudio = (enabled) => {
    this.setMicrophoneStatus(enabled);
    const localCameraStream = this.getLocalCameraStream();
    const audioTrack = localCameraStream.getAudioTracks()[0];
    if (audioTrack) {
      this.sendMicrophoneConfig();
      audioTrack.enabled = enabled;
    }
    this.sendMessage({
      content: `${this.getUser().full_name} turn ${enabled ? 'on' : 'off'} microphone`,
      type: 'LOG',
    });
  }

  enableVideo = (enabled) => {
    this.setCameraStatus(enabled);
    const localCameraStream = this.getLocalCameraStream();
    const videoTrack = localCameraStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = enabled;
      this.sendCameraConfig();
    }
    this.sendMessage({
      content: `${this.getUser().full_name} turn ${enabled ? 'on' : 'off'} camera`,
      type: 'LOG',
    });
  }

  requestShareScreen = async () => {
    try {
      const localScreenStream = await getDisplayMedia();
      this.setLocalScreenStream(localScreenStream);
      localScreenStream.getTracks()[0].addEventListener('ended', this.removeShareScreen);
      this.emit('screen-stream', {
        user: this.getUser(),
        stream: localScreenStream,
      });
      this.getPeers().forEach((x) => {
        x.addStream(localScreenStream);
      });
      this.sendMessage({
        content: `${this.getUser().full_name} start share screen`,
        type: 'LOG',
      });
    } catch (error) {
      this.emit('toast', { type: 'error', content: 'Can not access display' });
    }
  }

  removeShareScreen = () => {
    this.getLocalScreenStream().getTracks().forEach((x) => x.stop());
    socket.emit('screen-stream-ended', { userId: this.getUser().user_id });
    this.setLocalScreenStream(null);
    this.sendMessage({
      content: `${this.getUser().full_name} stop share screen`,
      type: 'LOG',
    });
  }

  requestRecordScreen = async () => {
    try {
      const recordScreenStream = await getDisplayMedia();
      const localCameraStream = this.getLocalCameraStream();
      recordScreenStream.addTrack(localCameraStream.getAudioTracks()[0]);
      const remoteCameraStream = this.getRemoteCameraStream();
      if (remoteCameraStream) {
        recordScreenStream.addTrack(remoteCameraStream.getAudioTracks()[0]);
      }
      recordScreenStream.getVideoTracks()[0].addEventListener('ended', this.stopRecordScreen);
      this.setRecordScreenStream(recordScreenStream);
      this.startRecordScreen();
      this.log('start record screen');
      this.emit('start-record-screen');
    } catch (error) {
      this.log(error);
      this.emit('toast', { type: 'error', content: 'Please provide recording screen permission.' });
    }
  }

  startRecordScreen = async () => {
    const recordScreenStream = this.getRecordScreenStream();
    if (!recordScreenStream) return;
    const recorder = new RecordRTCPromisesHandler(recordScreenStream, { type: 'video', disableLogs: true });
    await recorder.startRecording();
    this.setScreenRecorder(recorder);
    setTimeout(() => this.saveRecordScreen(), SCREEN_RECORD_TIME_LIMIT);
  }

  stopRecordScreen = async () => {
    this.log('stop record screen');
    const recorder = this.getScreenRecorder();
    const recordScreenStream = this.getRecordScreenStream();
    if (!recorder || !recordScreenStream) return;
    recordScreenStream.getTracks().forEach((x) => x.stop());
    this.saveRecordScreen();
    this.setScreenRecorder(null);
    this.setRecordScreenStream(null);
    this.emit('stop-record-screen');
  }

  saveRecordScreen = async () => {
    const recorder = this.getScreenRecorder();
    if (!recorder) return;
    await recorder.stopRecording();
    const blob = await recorder.getBlob();
    const file = new File([blob], 'video.webm');
    const fileId = uuid();
    file.id = fileId;
    this.addFileToSreenRecordFileQueue(file);
    this.log('record file queue', this.getSreenRecordFileQueue());
    this.startRecordScreen();
    try {
      const path = await this.uploadFile(file, 'recorders');
      this.log(`Saved screen record to server ${path}`);
      this.sendMessage({
        content: `Lesson recording (${moment().format('YYYY-MM-DD HH:mm:ss')})`,
        file: {
          name: file.name,
          path,
          size: file.size,
        },
        type: 'RECORD',
      });
    } catch {
      invokeSaveAsDialog(blob, `${Date.now()}_video.webm`);
      this.log('Saved screen record to local');
    } finally {
      this.removeFileFromScreenRecordFileQueue(fileId);
      this.log('record file queue', this.getSreenRecordFileQueue());
    }
  }

  sendCameraConfig = () => {
    socket.emit('turn-camera', {
      status: this.isCameraOn(),
      userId: this.getUser().user_id,
    });
  }
  sendMicrophoneConfig = () => {
    socket.emit('turn-microphone', {
      status: this.isMicrophoneOn(),
      userId: this.getUser().user_id,
    });
  }
  sendAllConfig = () => {
    this.sendCameraConfig();
    this.sendMicrophoneConfig();
  }

  uploadFile = (file, prefix = 'upload') => new Promise((resolve, reject) => {
    const key = `${prefix}/${Date.now()}_${file.name.replace(/[^A-z0-9.]/g, '_')}`;
    socket.emit('request-s3-presigned-url', { key });
    socket.once(`success-s3-presigned-url_${key}`, ({ presignedUrl, path }) => {
      axios.put(presignedUrl, file)
        .then(() => resolve(path))
        .catch(reject);
    });
    socket.once(`error-s3-presigned-url_${key}`, reject);
  })

  leave = () => {
    this.removeAllPeers();
    this.stopRecordScreen();
    this.sendMessage({
      content: `${this.getUser().full_name} left`,
      type: 'LOG',
    });
    socket.emit('leave');
  }

  static isSupported = () => Peer.WEBRTC_SUPPORT;

  log = (...params) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...params);
    }
  }
}

const params = qs.parse(window.location.search, { ignoreQueryPrefix: true });
const { domain, token, lessonId: roomCode, role } = params;
const peerClient = new PeerClient({ domain: atob(domain), token, roomCode, role });

export default peerClient;
