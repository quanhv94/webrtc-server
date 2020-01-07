import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import moment from 'moment';
import I18n from 'i18n-js';
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
    const { mediaDevices } = window.navigator;
    this.state = {
      canShareScreen: !!(mediaDevices && mediaDevices.getDisplayMedia),
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
    if (!peerClient.isScreenRecordFileQueueEmpty()) {
      toast.error(I18n.t('message-waitForUploadingRecord'));
      return;
    }
    const moveToHome = () => {
      window.onbeforeunload = null;
      peerClient.leave();
      toast.success(I18n.t('message-redirectingToHomePage'));
      setTimeout(peerClient.backToHomePage, 2000);
    };
    if (!peerClient.isOutOfTime()) {
      confirmAlert({
        message: I18n.t('message-exitConfirm'),
        buttons: [{
          label: I18n.t('common-cancel'),
        }, {
          label: I18n.t('common-exit'),
          onClick: moveToHome,
        }],
      });
    } else {
      moveToHome();
    }
  }

  render() {
    const { isRecordingScreen, screenRecordingTime, canShareScreen } = this.state;
    const { userConfig, currentUser } = this.props;
    if (!currentUser) return null;
    return (
      <div className="header-right">
        <Ability userRole={currentUser.role} accessibleRoles="TEACHER,STUDENT">
          {canShareScreen && (
            <Button
              color="transparent"
              className={classnames({ active: userConfig.shareScreenOn })}
              onClick={this.toggleShareScreen}
            >
              <i className="icon-screen-desktop" />
              {I18n.t('common-share')}
            </Button>
          )}
        </Ability>
        <Ability userRole={currentUser.role} accessibleRoles="TEACHER">
          {canShareScreen && (
            <Button
              color="transparent"
              className={classnames({ active: isRecordingScreen })}
              onClick={this.toggleRecordScreen}
            >
              <i className="fa fa-dot-circle-o" />
              {I18n.t('common-record')}
              {isRecordingScreen && (
                <span className="small recording-time">
                  {moment().startOf('day').seconds(screenRecordingTime).format('HH:mm:ss')}
                </span>
              )}
            </Button>
          )}
        </Ability>
        <Button
          color="transparent"
          onClick={this.leave}
        >
          <i className="fa fa-times-circle-o" />
          {I18n.t('common-exit')}
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
