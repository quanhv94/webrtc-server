import React from 'react';
import PropTypes from 'prop-types';


const convertTimeString = (totalSeconds) => {
  const minutes = parseInt(totalSeconds / 60, 10);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default class RecordTimer extends React.Component {
  static propTypes = {
    timeout: PropTypes.number.isRequired,
    onTimeout: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      recordedTime: 0,
    };
  }

  componentDidMount() {
    this.recordInterval = setInterval(() => {
      const { recordedTime } = this.state;
      const { timeout, onTimeout } = this.props;
      this.setState({ recordedTime: recordedTime + 1 });
      if (recordedTime === timeout) {
        onTimeout();
      }
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.recordInterval);
  }

  render() {
    const { recordedTime } = this.state;
    return (
      <div className="recording-time">
        <p>{`Recording: ${convertTimeString(recordedTime)} / 30:00`}</p>
      </div>
    );
  }
}
