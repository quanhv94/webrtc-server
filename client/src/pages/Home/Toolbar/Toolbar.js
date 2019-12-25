import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import qs from 'qs';
import { Button } from 'reactstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { confirmAlert } from 'react-confirm-alert';
import { toast } from 'react-toastify';
import peerClient from '../../../util/WebRTCClient';

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
      window.location.href = window.atob(params.domain);
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
    const { isRecordingScreen } = this.state;
    const { userConfig, currentUser } = this.props;
    return (
      <div className="header-right">
        <Button
          color="transparent"
          className={classnames({ active: userConfig.shareScreenOn })}
          onClick={this.toggleShareScreen}
        >
          <i className="icon-screen-desktop" />
        </Button>
        {currentUser && currentUser.role === 'TEACHER' && (
          <Button
            color="transparent"
            className={classnames({ active: isRecordingScreen })}
            onClick={this.toggleRecordScreen}
          >
            <i className="fa fa-dot-circle-o" />
          </Button>
        )}
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
