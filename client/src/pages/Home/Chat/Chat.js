import React from 'react';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import actions from '../../../state/chat/actions';
import peerClient from '../../../util/WebRTCClient';
import Form from './Form';
import './style.scss';
import ListMessages from './ListMessages';

const imageExtensions = /\.(gif|jpg|jpeg|tiff|png)$/i;

class ChatBox extends React.Component {
  static propTypes = {
    currentUser: PropTypes.object,
    messages: PropTypes.array.isRequired,
    appendMessage: PropTypes.func.isRequired,
    setTotalUnread: PropTypes.func.isRequired,
  }

  static defaultProps = {
    currentUser: null,
  }

  componentDidMount() {
    const { appendMessage, setTotalUnread } = this.props;
    peerClient.on('chat-message', (messages) => {
      appendMessage(messages);
    });
    peerClient.on('chat-total-unread', (totalUnread) => {
      setTotalUnread(totalUnread);
    });
  }

  sendMessage = (text) => {
    peerClient.sendMessage({ content: text });
  }

  sendFile = async (file) => {
    if (file.size > 1024 * 1024 * 10) {
      toast.error('Please select file less than 10MB');
      return;
    }
    toast.success('File is being uploaded');
    const uploadedPath = await peerClient.uploadFile(file, 'messages');
    peerClient.sendMessage('', {
      name: file.name,
      path: uploadedPath,
      size: file.size,
    }, imageExtensions.test(file.name) ? 'IMAGE' : 'FILE');
  }

  render() {
    const { currentUser, messages } = this.props;
    if (!currentUser) return null;
    return (
      <div className="chatbox">
        <ListMessages
          messages={messages}
          currentUser={currentUser}
        />
        <Form
          onSendMessage={this.sendMessage}
          onSendFile={this.sendFile}
        />
      </div>
    );
  }
}


const mapStateToProps = (state) => ({
  currentUser: state.user.profile,
  messages: state.chat.messages,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  appendMessage: actions.appendMessage,
  setTotalUnread: actions.setTotalUnread,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(ChatBox);
