/* eslint-disable jsx-a11y/media-has-caption */
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import _ from 'lodash';
import { Button } from 'reactstrap';
import { toast } from 'react-toastify';
import peerClient from '../../util/WebRTCClient';
import Sidebar from './Sidebar/Sidebar';
import errorActions from '../../state/error/actions';
import roomActions from '../../state/room/actions';
import userActions from '../../state/user/actions';
import partnerActions from '../../state/partner/actions';
import userConfigActions from '../../state/userConfig/actions';
import partnerConfigActions from '../../state/partnerConfig/actions';
import './style.scss';
import LocalStorage from '../../util/LocalStorage';
import Clock from '../../components/Clock';

class Home extends React.Component {
  static propTypes = {
    setError: PropTypes.func.isRequired,
    error: PropTypes.string.isRequired,
    room: PropTypes.object.isRequired,
    currentUser: PropTypes.object,
    hasPartner: PropTypes.bool.isRequired,
    setPartner: PropTypes.func.isRequired,
    userConfig: PropTypes.object.isRequired,
    partnerConfig: PropTypes.object.isRequired,
    setCurrentUser: PropTypes.func.isRequired,
    setRoom: PropTypes.func.isRequired,
    setCamera: PropTypes.func.isRequired,
    setMicrophone: PropTypes.func.isRequired,
    setShareScreen: PropTypes.func.isRequired,
    setPartnerCamera: PropTypes.func.isRequired,
    setPartnerMicrophone: PropTypes.func.isRequired,
    setPartnerShareScreen: PropTypes.func.isRequired,
  }

  static defaultProps = {
    currentUser: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      ready: false,
      time: null,
    };
    this.mainVideo = React.createRef();
    this.smallVideo1 = React.createRef();
    this.smallVideo2 = React.createRef();
  }

  componentDidMount() {
    const { roomCode, userId } = this.state;
    this.listenPeerClient({ roomCode, userId });
  }

  listenPeerClient = () => {
    peerClient.on('join-success', ({ user, room, currentTime }) => {
      const { setCurrentUser, setRoom, setCamera, setMicrophone } = this.props;
      this.setState({ time: currentTime });
      const userConfig = LocalStorage.loadUserConfig(user.user_id);
      if (userConfig) {
        setCamera(userConfig.cameraOn);
        setMicrophone(userConfig.microphoneOn);
      }
      setRoom(room);
      setCurrentUser(user);
    });
    peerClient.on('ready', () => {
      this.setState({ ready: true });
    });
    peerClient.on('local-camera-stream', (stream) => {
      this.smallVideo1.current.srcObject = stream;
    });
    peerClient.on('local-screen-stream', () => {
      const { setShareScreen } = this.props;
      setShareScreen(true);
    });
    peerClient.on('local-screen-stream-ended', () => {
      const { setShareScreen } = this.props;
      setShareScreen(false);
    });
    peerClient.on('remote-camera-stream', (stream) => {
      this.mainVideo.current.srcObject = stream;
      this.mainVideo.current.style.backgroundColor = '#000';
    });
    peerClient.on('remote-screen-stream', (stream) => {
      this.smallVideo2.current.srcObject = this.mainVideo.current.srcObject;
      this.mainVideo.current.srcObject = stream;
      const { setPartnerShareScreen } = this.props;
      setPartnerShareScreen(true);
    });
    peerClient.on('remote-screen-stream-ended', () => {
      this.mainVideo.current.srcObject = this.smallVideo2.current.srcObject;
      this.smallVideo2.current.srcObject = null;
      const { setPartnerShareScreen } = this.props;
      setPartnerShareScreen(false);
    });
    peerClient.on('remote-camera-on', () => {
      const { setPartnerCamera } = this.props;
      setPartnerCamera(true);
    });
    peerClient.on('remote-camera-off', () => {
      const { setPartnerCamera } = this.props;
      setPartnerCamera(false);
    });
    peerClient.on('remote-microphone-on', () => {
      const { setPartnerMicrophone } = this.props;
      setPartnerMicrophone(true);
    });
    peerClient.on('remote-microphone-off', () => {
      const { setPartnerMicrophone } = this.props;
      setPartnerMicrophone(false);
    });
    peerClient.on('toast', (message) => {
      toast[message.type](message.content);
    });
    peerClient.on('join-error', (error) => {
      const { setError } = this.props;
      setError(error);
    });
    peerClient.on('partner-leave', () => {
      const { setPartner } = this.props;
      setPartner(null);
      this.mainVideo.current.srcObject = null;
      this.mainVideo.current.style.backgroundColor = 'transparent';
      this.smallVideo2.current.srcObject = null;
    });
    peerClient.on('partner-join', (partner) => {
      const { setPartner } = this.props;
      setPartner(partner);
    });
  }

  toggleMicrophone = () => {
    const { userConfig, setMicrophone } = this.props;
    setMicrophone(!userConfig.microphoneOn);
    peerClient.enableAudio(!userConfig.microphoneOn);
  }

  toggleCamera = () => {
    const { userConfig, setCamera } = this.props;
    setCamera(!userConfig.cameraOn);
    peerClient.enableVideo(!userConfig.cameraOn);
  }

  toggleShareScreen = () => {
    const { userConfig } = this.props;
    if (userConfig.shareScreenOn) {
      peerClient.removeShareScreen();
    } else {
      peerClient.requestShareScreen();
    }
  }

  renderHeader = () => {
    const { userConfig, room, currentUser } = this.props;
    return (
      <div className="header">
        <div className="header-left">
          <div className="local-camera">
            <video
              ref={this.smallVideo1}
              playsInline
              autoPlay
              muted
            />
            <div className="controls">
              <Button
                color="transparent"
                className={classnames({ active: userConfig.microphoneOn })}
                onClick={this.toggleMicrophone}
              >
                <i className="icon-microphone" />
              </Button>
              <Button
                color="transparent"
                className={classnames({ active: userConfig.cameraOn })}
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
        <div className="header-center">
          <h4>{`${_.get(room, 'instance.instance_name')}-${room.name}`}</h4>
          <div>{`Hi, ${currentUser && currentUser.full_name}`}</div>
        </div>
        <div className="header-right">
          <Button
            color="transparent"
            className={classnames({ active: userConfig.shareScreenOn })}
            onClick={this.toggleShareScreen}
          >
            <i className="icon-screen-desktop" />
          </Button>
        </div>
      </div>
    );
  }

  render() {
    const { ready, time } = this.state;
    const {
      error,
      hasPartner,
      partnerConfig,
    } = this.props;
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
                  className={classnames({ active: partnerConfig.microphoneOn })}
                >
                  <i className="icon-microphone" />
                </Button>
                <Button
                  color="transparent"
                  className={classnames({ active: partnerConfig.cameraOn })}
                >
                  <i className="icon-camrecorder" />
                </Button>
              </div>
            </div>
            <Sidebar />
          </div>
        </div>
        {time && (
          <div style={{ position: 'absolute', left: 10, bottom: 10 }}>
            <Clock initialTime={time} />
          </div>
        )}
        <div className={classnames('waitting-ready', { 'd-none': ready })}>
          <h4>Please wait ...</h4>
        </div>
        <div className={classnames('error', { 'd-none': !error })}>
          <h3>{error}</h3>
        </div>
        <div className={classnames('waitting-partner-message', { 'd-none': hasPartner })}>
          <p>Please wait for your partner</p>
        </div>
      </div >
    );
  }
}

const mapStateToProps = (state) => ({
  error: state.error.message,
  room: state.room,
  currentUser: state.user.profile,
  hasPartner: !!state.partner.profile,
  userConfig: state.userConfig,
  partnerConfig: state.partnerConfig,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  setError: errorActions.setError,
  setPartner: partnerActions.setPartner,
  setRoom: roomActions.setRoom,
  setCurrentUser: userActions.setCurrentUser,
  setCamera: userConfigActions.setCamera,
  setMicrophone: userConfigActions.setMicrophone,
  setShareScreen: userConfigActions.setShareScreen,
  setPartnerCamera: partnerConfigActions.setCamera,
  setPartnerMicrophone: partnerConfigActions.setMicrophone,
  setPartnerShareScreen: partnerConfigActions.setShareScreen,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Home);
