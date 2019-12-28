/* eslint-disable jsx-a11y/media-has-caption */
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import _ from 'lodash';
import { Button } from 'reactstrap';
import moment from 'moment';
import { toast } from 'react-toastify';
import peerClient from '../../util/WebRTCClient';
import Sidebar from '../Home/Sidebar/Sidebar';
import errorActions from '../../state/error/actions';
import roomActions from '../../state/room/actions';
import userActions from '../../state/user/actions';
import partnerActions from '../../state/partner/actions';
import userConfigActions from '../../state/userConfig/actions';
import partnerConfigActions from '../../state/partnerConfig/actions';
import './style.scss';
import LocalStorage from '../../util/LocalStorage';
import Clock from '../../components/Clock';
import CountDownTimer from '../../components/CountDownTimer';
import Toolbar from '../Home/Toolbar/Toolbar';
import StreamVideo from '../../components/StreamVideo';

class View extends React.Component {
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
      currentTime: null,
      endingTime: null,
      localCameraStream: null,
      localScreenStream: null,
      remoteCameraStream: null,
      remoteScreenStream: null,
    };
  }

  componentDidMount() {
    this.listenPeerClient();
  }

  listenPeerClient = () => {
    peerClient.on('join-success', ({ user, roomDetail, currentTime }) => {
      const { setCurrentUser, setRoom, setCamera, setMicrophone } = this.props;
      this.setState({
        currentTime,
        endingTime: moment(roomDetail.plan_start_datetime).add(roomDetail.plan_duration, 'minute'),
      });
      const userConfig = LocalStorage.loadUserConfig(user.user_id);
      if (userConfig) {
        setCamera(userConfig.cameraOn);
        setMicrophone(userConfig.microphoneOn);
      }
      setRoom(roomDetail);
      setCurrentUser(user);
      // window.onbeforeunload = (event) => {
      //   event.returnValue = 'Are you sure to leave?';
      // };
    });
    peerClient.on('ready', () => {
      this.setState({ ready: true });
    });
    peerClient.on('camera-stream', ({ stream, user }) => {
      const { currentUser } = this.props;
      if (currentUser.user_id === user.user_id) {
        this.setState({ localCameraStream: stream });
      } else {
        this.setState({ remoteCameraStream: stream });
      }
    });
    peerClient.on('screen-stream', ({ stream, user }) => {
      const { currentUser, setShareScreen, setPartnerShareScreen } = this.props;
      if (currentUser.user_id === user.user_id) {
        setShareScreen(true);
        this.setState({ localScreenStream: stream });
      } else {
        this.setState({ remoteScreenStream: stream });
        setPartnerShareScreen(true);
      }
    });
    peerClient.on('screen-stream-ended', ({ userId }) => {
      const { currentUser, setShareScreen, setPartnerShareScreen } = this.props;
      if (currentUser.user_id === userId) {
        this.setState({ localScreenStream: null });
        setShareScreen(false);
      } else {
        this.setState({ remoteScreenStream: null });
        setPartnerShareScreen(false);
      }
    });
    peerClient.on('turn-camera', ({ userId, status }) => {
      const { setPartnerCamera, setCamera, currentUser } = this.props;
      if (currentUser.user_id === userId) {
        setCamera(status);
      } else {
        setPartnerCamera(status);
      }
    });
    peerClient.on('turn-microphone', ({ userId, status }) => {
      const { setPartnerMicrophone, setMicrophone, currentUser } = this.props;
      if (currentUser.user_id === userId) {
        setMicrophone(status);
      } else {
        setPartnerMicrophone(status);
      }
    });
    peerClient.on('toast', (message) => {
      toast[message.type](message.content);
    });
    peerClient.on('join-error', (error) => {
      const { setError } = this.props;
      setError(error);
    });
    peerClient.on('partner-left', () => {
      const { setPartner } = this.props;
      setPartner(null);
      this.setState({ remoteCameraStream: null, remoteScreenStream: null });
    });
    peerClient.on('partner-joined', (partner) => {
      const { setPartner } = this.props;
      setPartner(partner);
    });
  }

  toggleMicrophone = () => {
    const { userConfig } = this.props;
    peerClient.enableAudio(!userConfig.microphoneOn);
  }

  toggleCamera = () => {
    const { userConfig } = this.props;
    peerClient.enableVideo(!userConfig.cameraOn);
  }

  onTimeout = () => {
    toast.error('Time is out!');
  }

  renderHeader = () => {
    const {
      localCameraStream,
      remoteScreenStream,
      remoteCameraStream,
    } = this.state;
    const { userConfig, room, currentUser } = this.props;
    return (
      <div className="header">
        <div className="header-center">
          <h4>{`${_.get(room, 'instance.instance_name')}-${room.name}`}</h4>
          <div>{`Hi, ${currentUser && currentUser.full_name}`}</div>
        </div>
        <Toolbar />
      </div>
    );
  }

  render() {
    const {
      ready,
      currentTime,
      endingTime,
      remoteCameraStream,
      remoteScreenStream,
    } = this.state;
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
              <StreamVideo stream={remoteScreenStream || remoteCameraStream} />
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
              {ready && (
                <div>
                  <div style={{ position: 'absolute', left: 10, bottom: 10 }}>
                    <Clock initialTime={currentTime} />
                  </div>
                  <div style={{ position: 'absolute', right: 10, bottom: 10 }}>
                    <CountDownTimer endingTime={endingTime} onTimeout={this.onTimeout} />
                  </div>
                </div>
              )}
            </div>
            <Sidebar />
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

export default connect(mapStateToProps, mapDispatchToProps)(View);
