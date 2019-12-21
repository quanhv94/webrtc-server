import React from 'react';
import { Badge } from 'reactstrap';
import PropTypes from 'prop-types';
import moment from 'moment';

class Clock extends React.Component {
  static propTypes = {
    initialTime: PropTypes.string.isRequired,
    format: PropTypes.string,
  }

  static defaultProps = {
    format: 'YYYY-MM-DD HH:mm:ss',
  }

  constructor(props) {
    super(props);
    this.state = {
      time: moment(props.initialTime),
    };
  }

  componentDidMount() {
    this.startTimer();
  }

  startTimer = () => {
    setInterval(() => {
      const { time } = this.state;
      this.setState({
        time: time.add(1, 'second'),
      });
    }, 1000);
  }

  render() {
    const { time } = this.state;
    const { format } = this.props;
    return (
      <Badge color="primary">{time.format(format)}</Badge>
    );
  }
}


export default Clock;
