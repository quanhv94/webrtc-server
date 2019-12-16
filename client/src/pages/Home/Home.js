/* eslint-disable jsx-a11y/media-has-caption */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import _ from 'lodash';
import { Button } from 'reactstrap';
import { toast } from 'react-toastify';
import PeerClient from '../../util/WebRTCClient';
import './style.scss';
import Sidebar from './Sidebar';

export default class Home extends React.Component {
  static propTypes = {
    match: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);
    const { match } = props;
    const { userId, roomCode } = match.params;
    this.state = {
      ready: false,
      hasPartner: false,
      currentUser: null,
      userId,
      roomCode,
      error: '',
      messages: [],
      localConfig: {
        shareScreenOn: false,
        microphoneOn: true,
        cameraOn: true,
      },
      remoteConfig: {
        shareScreenOn: false,
        microphoneOn: true,
        cameraOn: true,
      },
    };
    this.mainVideo = React.createRef();
    this.smallVideo1 = React.createRef();
    this.smallVideo2 = React.createRef();
  }

  componentDidMount() {
    const { roomCode, userId } = this.state;
    this.createPeerClient({ roomCode, userId });
  }

  componentWillUnmount() {
    this.peerClient.destroy();
  }

  createPeerClient = ({ roomCode, userId }) => {
    const peerClient = new PeerClient({ roomCode, userId });
    peerClient.on('join-success', ({ user }) => {
      this.setState({ currentUser: user });
    });
    peerClient.on('ready', () => {
      this.setState({ ready: true });
    });
    peerClient.on('local-camera-stream', (stream) => {
      this.smallVideo1.current.srcObject = stream;
    });
    peerClient.on('local-screen-stream', () => {
      const { localConfig } = this.state;
      localConfig.shareScreenOn = true;
      this.setState({ localConfig });
    });
    peerClient.on('local-screen-stream-ended', () => {
      const { localConfig } = this.state;
      localConfig.shareScreenOn = false;
      this.setState({ localConfig });
    });
    peerClient.on('remote-camera-stream', (stream) => {
      this.mainVideo.current.srcObject = stream;
    });
    peerClient.on('remote-screen-stream', (stream) => {
      this.smallVideo2.current.srcObject = this.mainVideo.current.srcObject;
      this.mainVideo.current.srcObject = stream;
    });
    peerClient.on('remote-screen-stream-ended', () => {
      this.mainVideo.current.srcObject = this.smallVideo2.current.srcObject;
      this.smallVideo2.current.srcObject = null;
    });
    peerClient.on('remote-camera-on', () => {
      const { remoteConfig } = this.state;
      remoteConfig.cameraOn = true;
      this.setState({ remoteConfig });
    });
    peerClient.on('remote-camera-off', () => {
      const { remoteConfig } = this.state;
      remoteConfig.cameraOn = false;
      this.setState({ remoteConfig });
    });
    peerClient.on('remote-microphone-on', () => {
      const { remoteConfig } = this.state;
      remoteConfig.microphoneOn = true;
      this.setState({ remoteConfig });
    });
    peerClient.on('remote-microphone-off', () => {
      const { remoteConfig } = this.state;
      remoteConfig.microphoneOn = false;
      this.setState({ remoteConfig });
    });
    peerClient.on('toast', (message) => {
      toast[message.type](message.content);
    });
    peerClient.on('join-error', (error) => {
      this.setState({ error });
    });
    peerClient.on('partner-leave', () => {
      this.setState({ hasPartner: false });
      this.mainVideo.current.srcObject = null;
      this.smallVideo2.current.srcObject = null;
    });
    peerClient.on('partner-join', () => {
      this.setState({ hasPartner: true });
    });
    peerClient.on('chat-message', (newMessages) => {
      const { messages } = this.state;
      this.setState({ messages: _.concat(messages, newMessages) });
    });
    this.peerClient = peerClient;
  }

  toggleMicrophone = () => {
    const { localConfig } = this.state;
    localConfig.microphoneOn = !localConfig.microphoneOn;
    this.setState({ localConfig }, () => {
      this.peerClient.mute(localConfig.microphoneOn);
    });
  }

  toggleCamera = () => {
    const { localConfig } = this.state;
    localConfig.cameraOn = !localConfig.cameraOn;
    this.setState({ localConfig }, () => {
      this.peerClient.enableVideo(localConfig.cameraOn);
    });
  }

  toggleShareScreen = () => {
    const { localConfig } = this.state;
    if (localConfig.shareScreenOn) {
      this.peerClient.removeShareScreen();
    } else {
      this.peerClient.requestShareScreen();
    }
  }

  sendMessage = (text) => {
    this.peerClient.sendMessage(text);
  }

  renderHeader = () => {
    const {
      localConfig,
    } = this.state;
    return (
      <div className="header">
        <div className="header-left">
          <div className="local-camera">
            <video
              ref={this.smallVideo1}
              playsInline
              autoPlay
            />
            <div className="controls">
              <Button
                color="transparent"
                className={classnames({ active: localConfig.microphoneOn })}
                onClick={this.toggleMicrophone}
              >
                <i className="icon-microphone" />
              </Button>
              <Button
                color="transparent"
                className={classnames({ active: localConfig.cameraOn })}
                onClick={this.toggleCamera}
              >
                <i className="icon-camrecorder" />
              </Button>
            </div>
          </div>
          <div className="remote-camera">
            <video
              ref={this.smallVideo2}
              playsInline
              autoPlay
            />
          </div>
        </div>
        <div className="header-right">
          <Button
            color="transparent"
            className={classnames({ active: localConfig.shareScreenOn })}
            onClick={this.toggleShareScreen}
          >
            <i className="icon-screen-desktop" />
          </Button>
        </div>
      </div>
    );
  }

  render() {
    const {
      ready,
      hasPartner,
      remoteConfig,
      error,
      currentUser,
      messages,
    } = this.state;
    return (
      <div className={classnames('home-page')}>
        <div className={classnames('content-wrapper')}>
          {this.renderHeader()}
          <div className="screen-wrapper">
            <div className="main-video-container">
              <video
                ref={this.mainVideo}
                playsInline
                autoPlay
              />
              <div className={classnames('controls', { 'd-none': !hasPartner })}>
                <Button
                  color="transparent"
                  className={classnames({ active: remoteConfig.microphoneOn })}
                >
                  <i className="icon-microphone" />
                </Button>
                <Button
                  color="transparent"
                  className={classnames({ active: remoteConfig.cameraOn })}
                >
                  <i className="icon-camrecorder" />
                </Button>
              </div>
            </div>
            <Sidebar
              currentUser={currentUser}
              messages={messages}
              onSendMessage={this.sendMessage}
            />
          </div>
        </div>
        <div className={classnames('waitting-ready', { 'd-none': ready })}>
          <h4>Please wait ...</h4>
        </div>
        <div className={classnames('error', { 'd-none': !error })}>
          <h3>{error}</h3>
        </div>
        <div className={classnames('waitting-partner-message', { 'd-none': hasPartner })}>
          <p>Please wait for your partner</p>
        </div>
      </div>
    );
  }
}
