/* eslint-disable jsx-a11y/media-has-caption */
import React from 'react';
import PropTypes from 'prop-types';

class StreamVideo extends React.Component {
  static propTypes = {
    muted: PropTypes.bool,
    stream: PropTypes.any,
    className: PropTypes.string,
    style: PropTypes.object,
  }

  static defaultProps = {
    muted: false,
    stream: null,
    className: '',
    style: {},
  }

  componentDidUpdate(prevProps) {
    const nextProps = this.props;
    const oldStream = prevProps.stream;
    const newStream = nextProps.stream;
    if (oldStream !== newStream) {
      this.videoRef.srcObject = newStream;
      // autoPlay not work on iOS
      if (newStream) {
        this.videoRef.play();
      }
    }
  }

  render() {
    const { muted, className, style } = this.props;
    return (
      <video
        ref={(ref) => { this.videoRef = ref; }}
        muted={muted}
        playsInline
        className={className}
        style={style}
      />
    );
  }
}

export default StreamVideo;
