import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import classnames from 'classnames';
import _ from 'lodash';
import peerClient from '../../../util/WebRTCClient';

class ListMessages extends React.Component {
  static propTypes = {
    currentUser: PropTypes.object.isRequired,
    messages: PropTypes.array.isRequired,
    viewer: PropTypes.object,
  }

  static defaultProps = {
    viewer: null,
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
    if (lastOldMessageId !== lastNewMessageId) {
      this.bottomRef.current.scrollIntoView();
      peerClient.resetTotalUnread();
    }
  }

  renderFile = (message) => {
    const file = _.get(message, 'file');
    if (!file) return null;
    const filePath = _.get(message, 'file.path');
    const s3configs = peerClient.getStorageConfig().configs || {};
    const uri = `https://${s3configs.s3_default_bucket}.s3-${s3configs.s3_region}.amazonaws.com/${filePath}`;
    return (
      <div>
        {message.type === 'IMAGE' && <img src={uri} style={{ maxWidth: 200, maxHeight: 200 }} alt="" />}
        {message.type !== 'IMAGE' && <a href={uri} target="_blank" rel="noopener noreferrer">{file.name}</a>}
      </div>
    );
  }


  render() {
    const { messages, currentUser, viewer } = this.props;
    const userId = viewer ? viewer.userId : currentUser.user_id;
    return (
      <div className="content" ref={this.ref}>
        <div className="message-list">
          {messages.map((message) => (
            <div
              key={message.id}
              className={classnames({
                item: true,
                log: ['LOG', 'RECORD'].includes(message.type),
                record: message.type === 'RECORD',
                incoming: message.sender && userId !== message.sender.user_id && !['LOG', 'RECORD'].includes(message.type),
                outgoing: message.sender && userId === message.sender.user_id && !['LOG', 'RECORD'].includes(message.type),
              })}
            >
              <div className="timeline">{moment(message.sentAt).fromNow()}</div>
              <div className="bubble">
                {message.content}
                {this.renderFile(message)}
              </div>
            </div>
          ))}
        </div>
        <div ref={this.bottomRef} />
      </div>
    );
  }
}

export default ListMessages;
