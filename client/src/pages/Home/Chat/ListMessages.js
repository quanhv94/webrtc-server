import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import classnames from 'classnames';
import _ from 'lodash';

class ListMessages extends React.Component {
  static propTypes = {
    currentUser: PropTypes.object.isRequired,
    messages: PropTypes.array.isRequired,
  }

  constructor(props) {
    super(props);
    this.bottomRef = React.createRef();
  }

  componentDidUpdate(prevProps) {
    const { messages: oldMessages } = prevProps;
    const { messages: newMessages } = this.props;
    const lastOldMessageId = _.get(_.last(oldMessages), 'id');
    const lastNewMessageId = _.get(_.last(newMessages), 'id');
    if (lastOldMessageId !== lastNewMessageId.id) {
      this.bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  render() {
    const { messages, currentUser } = this.props;
    console.log(messages, currentUser);
    return (
      <div className="content" ref={this.ref}>
        <div className="message-list">
          {messages.map((message) => (
            <div
              key={message.id}
              className={classnames({
                item: true,
                log: message.type === 'LOG',
                incoming: message.sender && currentUser.user_id !== message.sender.user_id && message.type !== 'LOG',
                outgoing: message.sender && currentUser.user_id === message.sender.user_id && message.type !== 'LOG',
              })}
            >
              <div className="timeline">{moment(message.time).fromNow()}</div>
              <div className="bubble">{message.content}</div>
            </div>
          ))}
        </div>
        <div ref={this.bottomRef} />
      </div>
    );
  }
}

export default ListMessages;
