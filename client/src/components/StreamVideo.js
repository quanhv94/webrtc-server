/* eslint-disable jsx-a11y/media-has-caption */
import React from 'react';
import PropTypes from 'prop-types';

class StreamVideo extends React.Component {
  static propTypes = {
    muted: PropTypes.bool,
    stream: PropTypes.any,
  }

  static defaultProps = {
    muted: false,
    stream: null,
  }

  componentDidUpdate(prevProps) {
    const nextProps = this.props;
    const oldStream = prevProps.stream;
    const newStream = nextProps.stream;
    if (oldStream !== newStream) {
      console.log('new stream');
      this.videoRef.srcObject = newStream;
    }
  }

  render() {
    const { muted } = this.props;
    return (
      <video ref={(ref) => { this.videoRef = ref; }} muted={muted} autoPlay playsInline />
    );
  }
}

export default StreamVideo;
