import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import actions from '../../../state/chat/actions';
import peerClient from '../../../util/WebRTCClient';
import Form from './Form';
import './style.scss';
import ListMessages from './ListMessages';

class ChatBox extends React.Component {
  static propTypes = {
    currentUser: PropTypes.object,
    messages: PropTypes.array.isRequired,
    appendMessage: PropTypes.func.isRequired,
  }

  static defaultProps = {
    currentUser: null,
  }

  componentDidMount() {
    const { appendMessage } = this.props;
    peerClient.on('chat-message', (messages) => {
      appendMessage(messages);
    });
  }

  sendMessage = (text) => {
    peerClient.sendMessage(text);
  }

  render() {
    const { currentUser, messages } = this.props;
    if (!currentUser) return null;
    return (
      <div className="chatbox">
        <ListMessages messages={messages} currentUser={currentUser} />
        <Form onSendMessage={this.sendMessage} />
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
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(ChatBox);
