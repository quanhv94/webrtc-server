import React from 'react';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import I18n from 'i18n-js';
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
    viewer: PropTypes.object,
  }

  static defaultProps = {
    currentUser: null,
    viewer: null,
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
      toast.error(I18n.t('message-maximumFileSize'));
      return;
    }
    toast.success(I18n.t('message-uploadingFile'));
    const uploadedPath = await peerClient.uploadFile(file, 'messages');
    peerClient.sendMessage({
      content: '',
      file: {
        name: file.name,
        path: uploadedPath,
        size: file.size,
      },
      type: imageExtensions.test(file.name) ? 'IMAGE' : 'FILE',
    });
  }

  render() {
    const { currentUser, messages, viewer } = this.props;
    if (!currentUser) return null;
    return (
      <div className="chatbox">
        <ListMessages
          messages={messages}
          currentUser={currentUser}
          viewer={viewer}
        />
        {!viewer && (
          <Form
            onSendMessage={this.sendMessage}
            onSendFile={this.sendFile}
          />
        )}
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
