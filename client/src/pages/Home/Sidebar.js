import React from 'react';
import { Resizable } from 're-resizable';
import classnames from 'classnames';
import PropType from 'prop-types';
import moment from 'moment';
import { TabContent, TabPane, Nav, NavItem, NavLink, Input, Button } from 'reactstrap';
import './sidebar.scss';


export default class Sidebar extends React.Component {
  static propTypes = {
    onSendMessage: PropType.func.isRequired,
    messages: PropType.array,
    currentUser: PropType.object,
  }

  static defaultProps = {
    messages: [],
    currentUser: {},
  }

  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'Chat',
      messageText: '',
    };
  }

  toggle = (tab) => {
    this.setState({ activeTab: tab });
  }

  onChange = (e) => {
    this.setState({ messageText: e.target.value });
  }

  onKeyDown = (e) => {
    if (e.key === 'Enter') {
      this.sendMessage();
    }
  }

  sendMessage = () => {
    const { messageText } = this.state;
    const { onSendMessage } = this.props;
    if (!messageText) return;
    this.setState({ messageText: '' });
    onSendMessage(messageText);
  }

  render() {
    const { activeTab, messageText } = this.state;
    const { messages, currentUser } = this.props;
    return (
      <Resizable
        className="sidebar"
        defaultSize={{
          width: 350,
        }}
        handleStyles={{
          topLeft: { display: 'none' },
          top: { display: 'none' },
          topRight: { display: 'none' },
          right: { display: 'none' },
          bottomRight: { display: 'none' },
          bottom: { display: 'none' },
          bottomLeft: { display: 'none' },
        }}
      >
        <Nav tabs>
          <NavItem>
            <NavLink
              className={classnames({ active: activeTab === 'Chat' })}
              onClick={() => { this.toggle('Chat'); }}
            >
              Chat
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              className={classnames({ active: activeTab === 'Description' })}
              onClick={() => { this.toggle('Description'); }}
            >
              Description
            </NavLink>
          </NavItem>
        </Nav>
        <TabContent activeTab={activeTab}>
          <TabPane tabId="Chat">
            <div className="chatbox">
              <div className="content">
                <div className="message-list">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={classnames({
                        item: true,
                        log: message.type === 'LOG',
                        incoming: message.sender && currentUser.id !== message.sender.id && message.type !== 'LOG',
                        outgoing: message.sender && currentUser.id === message.sender.id && message.type !== 'LOG',
                      })}
                    >
                      <div className="timeline">{moment(message.time).fromNow()}</div>
                      <div className="bubble">{message.content}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="footer">
                <div className="wrapper">
                  <Button onClick={() => this.fileInput.click()} color="transparent">
                    <i className="fa fa-paperclip" />
                    <input className="d-none" type="file" ref={(ref) => { this.fileInput = ref; }} />
                  </Button>
                  <Input
                    type="text"
                    placeholder="Tin nhắn ..."
                    value={messageText}
                    onChange={this.onChange}
                    onKeyDown={this.onKeyDown}
                  />
                  <Button color="transparent" onClick={this.sendMessage}>
                    <i className="fa fa-send" />
                  </Button>
                </div>
              </div>
            </div>
          </TabPane>
          <TabPane tabId="Description">
            <div className="p-3">
              Lorem Ipsum is simply dummy text of the printing and
              typesetting industry. Lorem Ipsum has been the industry
              standard dummy text ever since the 1500s, when an unknown
              printer took a galley of type and scrambled it to make a type
              specimen book. It has survived not only five centuries, but also the
              leap into electronic typesetting, remaining essentially unchanged.
              It was popularised in the 1960s with the release of Letraset sheets
              containing Lorem Ipsum passages, and more recently with desktop publishing
              software like Aldus PageMaker including versions of Lorem Ipsum.
            </div>
          </TabPane>
        </TabContent>
      </Resizable>
    );
  }
}
