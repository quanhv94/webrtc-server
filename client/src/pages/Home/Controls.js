import React from 'react';
import { Button } from 'reactstrap';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const Controls = ({
  microphoneOn,
  cameraOn,
  shareScreenOn,
  toggleMicrophone,
  toggleCamera,
  toggleShareScreen,
}) => (
    <div className="control-wrapper">
      <Button
        color="transparent"
        className={classnames({ active: microphoneOn })}
        onClick={toggleMicrophone}
      >
        <i className="icon-microphone" />
        <div className="small">Mic</div>
      </Button>
      <Button
        color="transparent"
        className={classnames({ active: cameraOn })}
        onClick={toggleCamera}
      >
        <i className="icon-camrecorder" />
        <div className="small">Cam</div>
      </Button>
      <Button
        color="transparent"
        className={classnames({ active: shareScreenOn })}
        onClick={toggleShareScreen}
      >
        <i className="icon-screen-desktop" />
        <div className="small">Share</div>
      </Button>
    </div>
  );

Controls.propTypes = {
  microphoneOn: PropTypes.bool.isRequired,
  cameraOn: PropTypes.bool.isRequired,
  shareScreenOn: PropTypes.bool.isRequired,
  toggleMicrophone: PropTypes.func.isRequired,
  toggleCamera: PropTypes.func.isRequired,
  toggleShareScreen: PropTypes.func.isRequired,
};

export default Controls;
