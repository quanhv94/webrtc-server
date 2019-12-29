
import React from 'react';
import { Button, Input } from 'reactstrap';
import PropTypes from 'prop-types';
import I18n from 'i18n-js';
import Dropzone from 'react-dropzone';

export default class Form extends React.Component {
  static propTypes = {
    onSendMessage: PropTypes.func.isRequired,
    onSendFile: PropTypes.func.isRequired,
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

  onSelectFile = (files) => {
    const file = files[0];
    if (file) {
      const { onSendFile } = this.props;
      onSendFile(file);
    }
  }

  render() {
    const { text } = this.state;
    return (
      <div className="footer">
        <div className="wrapper">
          <Dropzone onDrop={this.onSelectFile} multiple={false}>
            {({ getRootProps, getInputProps }) => (
              <Button {...getRootProps()} color="transparent">
                <i className="fa fa-paperclip" />
                <input {...getInputProps()} />
              </Button>
            )}
          </Dropzone>
          <Input
            type="text"
            placeholder={I18n.t('chat-pleaseTypeMessage')}
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
