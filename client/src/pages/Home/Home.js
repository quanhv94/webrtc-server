/* eslint-disable jsx-a11y/media-has-caption */
import React from 'react';
import { Button } from 'reactstrap';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { RecordRTCPromisesHandler, invokeSaveAsDialog } from 'recordrtc';
import { toast } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';
import Controls from './Controls';
import socket from '../../socket';
import './style.scss';
import PeerClient from '../../util/WebRTCClient';
import RecordTimer from './RecordTimer';

export default class Home extends React.Component {
  static propTypes = {
    match: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);
    const { match } = props;
    const { userId, roomCode } = match.params;
    this.state = {
      hasCameraPermission: false,
      screenFull: 0,
      microphoneOn: true,
      cameraOn: true,
      shareScreenOn: false,
      recordOn: false,
      userId,
      roomCode,
      error: '',
      peers: {},
    };
  }

  componentDidMount() {
    const { roomCode, userId } = this.state;
    this.createPeerClient({ roomCode, userId }).on('ready', () => {
      this.setState({ hasCameraPermission: true });
      socket.emit('join', { roomCode, userId });
      socket.addEventListener('message', this.showMessage);
      socket.addEventListener('peers', this.handlePeers);
      socket.addEventListener('join-error', this.handleError);
      socket.addEventListener('start-call', this.startCall);
    });
  }

  componentWillUnmount() {
    this.removePeerClient();
    socket.emit('leave');
    socket.removeEventListener('message', this.showMessage);
    socket.removeEventListener('peers', this.handlePeers);
    socket.removeEventListener('join-error', this.handleError);
    socket.removeEventListener('start-call', this.startCall);
  }

  createPeerClient = ({ roomCode, userId }) => {
    this.peerClient = new PeerClient({ roomCode, userId });
    this.peerClient.on('local-camera-stream', (stream) => {
      const video = document.querySelector('#localVideo1');
      video.srcObject = stream;
    });
    this.peerClient.on('local-screen-stream', (stream) => {
      const video1 = document.querySelector('#localVideo1');
      const video2 = document.querySelector('#localVideo2');
      video2.srcObject = video1.srcObject;
      video1.srcObject = stream;
      this.setState({ shareScreenOn: true });
    });
    this.peerClient.on('local-screen-stream-ended', () => {
      const video1 = document.querySelector('#localVideo1');
      const video2 = document.querySelector('#localVideo2');
      video1.srcObject = video2.srcObject;
      video2.srcObject = null;
      this.setState({ shareScreenOn: false });
    });
    this.peerClient.on('remote-camera-stream', (stream) => {
      const video = document.querySelector('#remoteVideo1');
      video.srcObject = stream;
    });
    this.peerClient.on('remote-screen-stream', (stream) => {
      const video1 = document.querySelector('#remoteVideo1');
      const video2 = document.querySelector('#remoteVideo2');
      video2.srcObject = video1.srcObject;
      video1.srcObject = stream;
    });
    this.peerClient.on('remote-screen-stream-ended', () => {
      const video1 = document.querySelector('#remoteVideo1');
      const video2 = document.querySelector('#remoteVideo2');
      video1.srcObject = video2.srcObject;
      video2.srcObject = null;
    });
    this.peerClient.on('error', (error) => {
      toast.error(error);
    });
    return this.peerClient;
  }

  removePeerClient = () => {
    this.peerClient.destroy();
  }

  toggleFullscreen = (index) => {
    const { screenFull } = this.state;
    if (index === screenFull) {
      this.setState({ screenFull: 0 });
    } else {
      this.setState({ screenFull: index });
    }
  }

  showMessage = (message) => {
    if (toast[message.type]) {
      toast[message.type](message.content);
    }
  }

  handleError = (error) => {
    this.setState({ error });
  }

  handlePeers = (peers) => {
    this.setState({ peers });
    if (Object.keys(peers).length < 2) {
      const video1 = document.querySelector('#remoteVideo1');
      const video2 = document.querySelector('#remoteVideo2');
      video1.srcObject = null;
      video2.srcObject = null;
    }
  }

  startCall = (caller) => {
    const { userId } = this.state;
    this.peerClient.startCall({ initiator: caller === userId });
  }

  toggleMicrophone = () => {
    const { microphoneOn } = this.state;
    this.setState({ microphoneOn: !microphoneOn }, () => {
      this.peerClient.mute(!microphoneOn);
    });
  }

  toggleCamera = () => {
    const { cameraOn } = this.state;
    this.setState({ cameraOn: !cameraOn }, () => {
      this.peerClient.enableVideo(!cameraOn);
    });
  }

  toggleShareScreen = () => {
    this.peerClient.toggleShareScreen();
  }

  toggleRecord = async () => {
    const { recordOn } = this.state;
    if (!recordOn) {
      confirmAlert({
        title: 'Screen record confirm',
        message: 'Do you really want to record your screen. You need to save before record again each 30 minutes.',
        buttons: [
          {
            label: 'OK',
            onClick: async () => {
              const screenStream = await this.peerClient.requestRecordScreenStream();
              if (!screenStream) return;
              this.setState({ recordOn: true });
              screenStream.getVideoTracks()[0].addEventListener('ended', () => {
                this.toggleRecord();
              });
              this.recorder = new RecordRTCPromisesHandler(screenStream, {
                type: 'video',
                disableLogs: true,
              });
              this.recorder.startRecording();
            },
          },
          {
            label: 'Cancel',
          },
        ],
      });
    } else {
      this.setState({ recordOn: false });
      await this.recorder.stopRecording();
      const blob = await this.recorder.getBlob();
      invokeSaveAsDialog(blob);
      this.recorder.destroy();
      this.peerClient.removeRecordScreenStream();
    }
  }

  render() {
    const {
      hasCameraPermission,
      screenFull,
      microphoneOn,
      cameraOn,
      shareScreenOn,
      recordOn,
      error,
      peers,
    } = this.state;
    return (
      <div className={classnames('home-page')}>
        <div className={classnames('content-wrapper')}>
          <div className="screen-wrapper">
            <div className="screen" style={{ flexBasis: ['50%', '80%', '20%'][screenFull] }}>
              <div className="screen-content">
                <video id="localVideo1" playsInline autoPlay muted />
                <video id="localVideo2" playsInline autoPlay muted />
              </div>
              <Button color="transparent" onClick={() => this.toggleFullscreen(1)}>
                <i className={`icon-size-${screenFull === 1 ? 'actual' : 'fullscreen'}`} />
              </Button>
            </div>
            <div className="screen" style={{ flexBasis: ['50%', '20%', '80%'][screenFull] }}>
              <div className="screen-content">
                <video id="remoteVideo1" playsInline autoPlay />
                <video id="remoteVideo2" playsInline autoPlay />
              </div>
              <Button color="transparent" onClick={() => this.toggleFullscreen(2)}>
                <i className={`icon-size-${screenFull === 2 ? 'actual' : 'fullscreen'}`} />
              </Button>
            </div>
          </div>
          <Controls
            microphoneOn={microphoneOn}
            cameraOn={cameraOn}
            shareScreenOn={shareScreenOn}
            recordOn={recordOn}
            onClickMicrophone={this.toggleMicrophone}
            onClickCamera={this.toggleCamera}
            onClickShareScreen={this.toggleShareScreen}
            onClickRecord={this.toggleRecord}
          />
        </div>
        <div className={classnames('error', { 'd-none': !error })}>
          <h3>{error}</h3>
        </div>
        <div className={classnames('watting-camera-permission', { 'd-none': hasCameraPermission })}>
          <h4>Accessing camera</h4>
        </div>
        <div className={classnames('watting-message', { 'd-none': Object.keys(peers).length >= 2 })}>
          <p>Please wait for your partner</p>
        </div>
        {recordOn && <RecordTimer timeout={60 * 30} onTimeout={this.toggleRecord} />}
      </div>
    );
  }
}
