/* eslint-disable jsx-a11y/media-has-caption */
import React from 'react';
import PropTypes from 'prop-types';

class StreamVideo extends React.Component {
  static propTypes = {
    muted: PropTypes.bool,
    stream: PropTypes.any,
    className: PropTypes.string,
  }

  static defaultProps = {
    muted: false,
    stream: null,
    className: '',
  }

  componentDidUpdate(prevProps) {
    const nextProps = this.props;
    const oldStream = prevProps.stream;
    const newStream = nextProps.stream;
    if (oldStream !== newStream) {
      this.videoRef.srcObject = newStream;
    }
  }

  render() {
    const { muted, className } = this.props;
    return (
      <video
        ref={(ref) => { this.videoRef = ref; }}
        muted={muted}
        autoPlay
        playsInline
        className={className}
      />
    );
  }
}

export default StreamVideo;
