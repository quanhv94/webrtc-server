import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import qs from 'qs';
import moment from 'moment';
import { Button } from 'reactstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { confirmAlert } from 'react-confirm-alert';
import { toast } from 'react-toastify';
import peerClient from '../../../util/WebRTCClient';
import Ability from '../../../components/Ability';

class ToolBar extends React.Component {
  static propTypes = {
    currentUser: PropTypes.object,
    userConfig: PropTypes.object.isRequired,
  }

  static defaultProps = {
    currentUser: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      isRecordingScreen: false,
      screenRecordingTime: 0,
    };
  }

  componentDidMount() {
    let interval;
    peerClient.on('start-record-screen', () => {
      this.setState({ isRecordingScreen: true, screenRecordingTime: 0 });
      interval = setInterval(() => {
        const { screenRecordingTime } = this.state;
        this.setState({ screenRecordingTime: screenRecordingTime + 1 });
      }, 1000);
    });
    peerClient.on('stop-record-screen', () => {
      this.setState({ isRecordingScreen: false });
      window.clearInterval(interval);
    });
  }

  toggleShareScreen = () => {
    const { userConfig } = this.props;
    if (userConfig.shareScreenOn) {
      peerClient.removeShareScreen();
    } else {
      peerClient.requestShareScreen();
    }
  }

  toggleRecordScreen = () => {
    const { isRecordingScreen } = this.state;
    if (isRecordingScreen) {
      peerClient.stopRecordScreen();
    } else {
      peerClient.requestRecordScreen();
    }
  }

  leave = () => {
    const params = qs.parse(window.location.search, { ignoreQueryPrefix: true });
    if (!peerClient.isScreenRecordFileQueueEmpty()) {
      toast.error('Recording files are being uploaded. Please wait');
      return;
    }
    const moveToHome = () => {
      window.onbeforeunload = null;
      peerClient.leave();
      toast.success('Redirecting to home page');
      setTimeout(() => {
        window.location.href = window.atob(params.domain);
      }, 2000);
    };
    if (!peerClient.isOutOfTime()) {
      confirmAlert({
        message: 'Are you sure to leave?',
        buttons: [{
          label: 'Cancel',
        }, {
          label: 'Leave',
          onClick: moveToHome,
        }],
      });
    } else {
      moveToHome();
    }
  }

  render() {
    const { isRecordingScreen, screenRecordingTime } = this.state;
    const { userConfig, currentUser } = this.props;
    if (!currentUser) return null;
    return (
      <div className="header-right">
        <Ability userRole={currentUser.role} accessibleRoles="TEACHER,STUDENT">
          <Button
            color="transparent"
            className={classnames({ active: userConfig.shareScreenOn })}
            onClick={this.toggleShareScreen}
          >
            <i className="icon-screen-desktop" />
          </Button>
        </Ability>
        <Ability userRole={currentUser.role} accessibleRoles="TEACHER">
          <Button
            color="transparent"
            className={classnames({ active: isRecordingScreen })}
            onClick={this.toggleRecordScreen}
          >
            <i className="fa fa-dot-circle-o" />
            {isRecordingScreen && (
              <span className="small recording-time">
                {moment().startOf('day').seconds(screenRecordingTime).format('HH:mm:ss')}
              </span>
            )}
          </Button>
        </Ability>
        <Button
          color="transparent"
          onClick={this.leave}
        >
          <i className="fa fa-times-circle-o" />
        </Button>
      </div>
    );
  }
}


const mapStateToProps = (state) => ({
  currentUser: state.user.profile,
  userConfig: state.userConfig,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(ToolBar);
