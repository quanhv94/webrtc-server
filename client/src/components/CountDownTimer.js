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
    return (
      <Badge color="danger">{moment().startOf('day').seconds(duration).format('HH:mm:ss')}</Badge>
    );
  }
}


export default CountDownTimer;
