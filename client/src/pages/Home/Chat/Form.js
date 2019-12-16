
import React from 'react';
import { Button, Input } from 'reactstrap';
import PropTypes from 'prop-types';

export default class Form extends React.Component {
  static propTypes = {
    onSendMessage: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      text: '',
    };
  }


  onChange = (e) => {
    this.setState({ text: e.target.value });
  }

  onKeyDown = (e) => {
    if (e.key === 'Enter') {
      this.sendMessage();
    }
  }

  sendMessage = () => {
    const { text } = this.state;
    const { onSendMessage } = this.props;
    if (!text) return;
    this.setState({ text: '' });
    onSendMessage(text);
  }

  render() {
    const { text } = this.state;
    return (
      <div className="footer">
        <div className="wrapper">
          <Button onClick={() => this.fileInput.click()} color="transparent">
            <i className="fa fa-paperclip" />
            <input className="d-none" type="file" ref={(ref) => { this.fileInput = ref; }} />
          </Button>
          <Input
            type="text"
            placeholder="Tin nhắn ..."
            value={text}
            onChange={this.onChange}
            onKeyDown={this.onKeyDown}
          />
          <Button color="transparent" onClick={this.sendMessage}>
            <i className="fa fa-send" />
          </Button>
        </div>
      </div>
    );
  }
}
