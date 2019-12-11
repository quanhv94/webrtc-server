import React from 'react';
import { Button } from 'reactstrap';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const Controls = ({
  microphoneOn,
  cameraOn,
  shareScreenOn,
  recordOn,
  onClickMicrophone,
  onClickCamera,
  onClickShareScreen,
  onClickRecord,
  // eslint-disable-next-line arrow-body-style
}) => {
  return (
    <div className="control-wrapper">
      <Button
        color="transparent"
        className={classnames({ active: microphoneOn })}
        onClick={onClickMicrophone}
      >
        <i className="icon-microphone" />
        <div className="small">Mic</div>
      </Button>
      <Button
        color="transparent"
        className={classnames({ active: cameraOn })}
        onClick={onClickCamera}
      >
        <i className="icon-camrecorder" />
        <div className="small">Cam</div>
      </Button>
      <Button
        color="transparent"
        className={classnames({ active: shareScreenOn })}
        onClick={onClickShareScreen}
      >
        <i className="icon-screen-desktop" />
        <div className="small">Share</div>
      </Button>
      <Button
        color="transparent"
        className={classnames({ active: recordOn })}
        onClick={onClickRecord}
      >
        <i className="fa fa-dot-circle-o" />
        <div className="small">Rec</div>
      </Button>
    </div>
  );
};

Controls.propTypes = {
  microphoneOn: PropTypes.bool.isRequired,
  cameraOn: PropTypes.bool.isRequired,
  shareScreenOn: PropTypes.bool.isRequired,
  recordOn: PropTypes.bool.isRequired,
  onClickMicrophone: PropTypes.func.isRequired,
  onClickCamera: PropTypes.func.isRequired,
  onClickShareScreen: PropTypes.func.isRequired,
  onClickRecord: PropTypes.func.isRequired,
};

export default Controls;
