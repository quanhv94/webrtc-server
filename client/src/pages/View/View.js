/* eslint-disable jsx-a11y/media-has-caption */
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import _ from 'lodash';
import { Button } from 'reactstrap';
import moment from 'moment';
import I18n from 'i18n-js';
import { toast } from 'react-toastify';
import peerClient from '../../util/WebRTCClient';
import Sidebar from '../Home/Sidebar/Sidebar';
import errorActions from '../../state/error/actions';
import roomActions from '../../state/room/actions';
import userActions from '../../state/user/actions';
import './style.scss';
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
    setCurrentUser: PropTypes.func.isRequired,
    setRoom: PropTypes.func.isRequired,
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
      teacher: {},
      student: {},
      teacherCameraStream: null,
      teacherScreenStream: null,
      studentCameraStream: null,
      studentScreenStream: null,
      teacherMicrophoneOn: false,
      teacherCameraOn: false,
      studentMicrophoneOn: false,
      studentCameraOn: false,
    };
  }

  componentDidMount() {
    this.listenPeerClient();
  }

  listenPeerClient = () => {
    peerClient.on('current-user', (user) => {
      const { setCurrentUser } = this.props;
      setCurrentUser(user);
      if (!['MANAGER', 'PARENT', 'ADMIN'].includes(user.role)) {
        alert('Do not have permission');
        window.location.href = '/';
      } else {
        peerClient.startJoin();
      }
    });
    peerClient.on('join-success', ({ roomDetail, currentTime }) => {
      const language = _.get(roomDetail, 'instance.language', 'en');
      I18n.locale = language;
      const { setRoom } = this.props;
      this.setState({
        currentTime,
        endingTime: moment(roomDetail.plan_start_datetime).add(roomDetail.plan_duration, 'minute'),
      });

      setRoom(roomDetail);
      // window.onbeforeunload = (event) => {
      //   event.returnValue = 'Are you sure to leave?';
      // };
    });
    peerClient.on('teacher-info', (teacher) => {
      this.setState({ teacher });
    });
    peerClient.on('student-info', (student) => {
      this.setState({ student });
    });
    peerClient.on('ready', () => {
      this.setState({ ready: true });
    });
    peerClient.on('camera-stream', ({ stream, user }) => {
      const { teacher, student } = this.state;
      if (teacher.userId === user.user_id) {
        this.setState({ teacherCameraStream: stream });
      }
      if (student.userId === user.user_id) {
        this.setState({ studentCameraStream: stream });
      }
    });
    peerClient.on('screen-stream', ({ stream, user }) => {
      const { teacher, student } = this.state;
      if (teacher.userId === user.user_id) {
        this.setState({ teacherScreenStream: stream });
      }
      if (student.userId === user.user_id) {
        this.setState({ studentScreenStream: stream });
      }
    });
    peerClient.on('screen-stream-ended', ({ userId }) => {
      const { teacher, student } = this.state;
      if (teacher.userId === userId) {
        this.setState({ teacherScreenStream: null });
      }
      if (student.userId === userId) {
        this.setState({ studentScreenStream: null });
      }
    });
    peerClient.on('turn-camera', ({ userId, status }) => {
      const { teacher, student } = this.state;
      if (teacher.userId === userId) {
        this.setState({ teacherCameraOn: status });
      }
      if (student.userId === userId) {
        this.setState({ studentCameraOn: status });
      }
    });
    peerClient.on('turn-microphone', ({ userId, status }) => {
      const { teacher, student } = this.state;
      if (teacher.userId === userId) {
        this.setState({ teacherMicrophoneOn: status });
      }
      if (student.userId === userId) {
        this.setState({ studentMicrophoneOn: status });
      }
    });
    peerClient.on('leave', ({ leaver }) => {
      const { teacher, student } = this.state;
      if (teacher.userId === leaver.user_id) {
        this.setState({ teacherCameraStream: null, teacherScreenStream: null });
      }
      if (student.userId === leaver.user_id) {
        this.setState({ studentCameraStream: null, studentScreenStream: null });
      }
    });
    peerClient.on('toast', (message) => {
      toast[message.type](message.content);
    });
    peerClient.on('error-message', (error) => {
      const { setError } = this.props;
      setError(error);
    });
  }

  onTimeout = () => {
    toast.error('Time is out!');
  }

  renderHeader = () => {
    const { room, currentUser } = this.props;
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
      teacher,
      teacherCameraStream,
      teacherScreenStream,
      teacherCameraOn,
      teacherMicrophoneOn,
      studentCameraStream,
      studentScreenStream,
      studentCameraOn,
      studentMicrophoneOn,
    } = this.state;
    const { error } = this.props;
    return (
      <div className={classnames('home-page')}>
        <div className={classnames('content-wrapper')}>
          {this.renderHeader()}
          <div className="screen-wrapper">
            <div className="main-video-container">
              <StreamVideo stream={teacherScreenStream ? teacherCameraStream : null} className="small" />
              <StreamVideo stream={teacherScreenStream || teacherCameraStream} />
              <div className={classnames('controls', { 'd-none': !teacherCameraStream })}>
                <Button
                  color="transparent"
                  className={classnames({ active: teacherMicrophoneOn })}
                >
                  <i className="icon-microphone" />
                </Button>
                <Button
                  color="transparent"
                  className={classnames({ active: teacherCameraOn })}
                >
                  <i className="icon-camrecorder" />
                </Button>
              </div>
            </div>
            <div style={{ width: 2, backgroundColor: '#fff' }} />
            <div className="main-video-container">
              <StreamVideo stream={studentScreenStream ? studentCameraStream : null} className="small" />
              <StreamVideo stream={studentScreenStream || studentCameraStream} />
              <div className={classnames('controls', { 'd-none': !studentCameraStream })}>
                <Button
                  color="transparent"
                  className={classnames({ active: studentMicrophoneOn })}
                >
                  <i className="icon-microphone" />
                </Button>
                <Button
                  color="transparent"
                  className={classnames({ active: studentCameraOn })}
                >
                  <i className="icon-camrecorder" />
                </Button>
              </div>
            </div>
            {ready && (
              <div style={{ position: 'absolute', left: 10, bottom: 10 }}>
                <Clock initialTime={currentTime} />
                {' '}
                <CountDownTimer endingTime={endingTime} onTimeout={this.onTimeout} />
              </div>
            )}
            <Sidebar viewer={teacher} />
          </div>
        </div>
        <div className={classnames('waitting-ready', { 'd-none': ready })}>
          <h4>Please wait ...</h4>
        </div>
        <div className={classnames('error', { 'd-none': !error })}>
          <h3>{error}</h3>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  error: state.error.message,
  room: state.room,
  currentUser: state.user.profile,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  setError: errorActions.setError,
  setRoom: roomActions.setRoom,
  setCurrentUser: userActions.setCurrentUser,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(View);
