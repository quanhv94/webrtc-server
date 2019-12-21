import React from 'react';
import moment from 'moment';
import { Badge } from 'reactstrap';
import PropTypes from 'prop-types';

class CountDownTimer extends React.Component {
  static propTypes = {
    endingTime: PropTypes.any.isRequired,
    onTimeout: PropTypes.func,
  }

  static defaultProps = {
    onTimeout: () => null,
  }

  constructor(props) {
    super(props);
    const duration = moment(props.endingTime).diff(moment(), 'second');
    this.state = {
      duration,
    };
  }

  componentDidMount() {
    this.startTimer();
  }

  startTimer = () => {
    const { onTimeout } = this.props;
    this.interval = window.setInterval(() => {
      const { duration } = this.state;
      if (duration === 0) {
        onTimeout();
        clearInterval(this.interval);
      } else {
        this.setState({
          duration: duration - 1,
        });
      }
    }, 1000);
  }

  render() {
    const { duration } = this.state;
    const hours = Math.floor(duration / 3600).toString().padStart('2', 0);
    const minutes = Math.floor((duration / 60) % 60).toString().padStart('2', 0);
    const seconds = Math.floor(duration % 60).toString().padStart('2', 0);
    return (
      <Badge color="danger">{`${hours}:${minutes}:${seconds}`}</Badge>
    );
  }
}


export default CountDownTimer;
