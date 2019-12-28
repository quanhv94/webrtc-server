import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Resizable } from 're-resizable';
import classnames from 'classnames';
import PropType from 'prop-types';
import { TabContent, TabPane, Nav, NavItem, NavLink, Badge } from 'reactstrap';
import actions from '../../../state/sidebar/actions';
import ChatBox from '../Chat/Chat';
import NoteBox from '../Note/Note';
import './sidebar.scss';
import LocalStorage from '../../../util/LocalStorage';


class Sidebar extends React.Component {
  static propTypes = {
    setActiveTab: PropType.func.isRequired,
    activeTab: PropType.string.isRequired,
    room: PropType.object.isRequired,
    chat: PropType.object.isRequired,
  }

  componentDidMount() {
    const sidebarWidth = LocalStorage.loadSidebarWidth();
    if (sidebarWidth) {
      const sidebar = document.querySelector('.sidebar');
      sidebar.style.width = `${sidebarWidth}px`;
    }
    this.onResize();
  }

  toggle = (tab) => {
    const { setActiveTab } = this.props;
    setActiveTab(tab);
  }

  onResize = () => {
    const sidebar = document.querySelector('.sidebar');
    const sidebarWidth = sidebar.clientWidth;
    LocalStorage.saveSidebarWidth(sidebarWidth);
    if (sidebarWidth > 500) {
      sidebar.classList.add('large');
    } else {
      sidebar.classList.remove('large');
    }
  }

  render() {
    const { activeTab, room, chat } = this.props;
    return (
      <Resizable
        className="sidebar d-none d-md-flex"
        ref={(ref) => { this.sidebarRef = ref; }}
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
        onResize={this.onResize}
      >
        <Nav tabs>
          <NavItem>
            <NavLink
              className={classnames({ active: activeTab === 'Chat' })}
              onClick={() => { this.toggle('Chat'); }}
            >
              Chat
              {chat.totalUnread > 0 && (
                <Badge color="danger round" style={{ marginLeft: 10 }}>{chat.totalUnread}</Badge>
              )}
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
          <NavItem>
            <NavLink
              className={classnames({ active: activeTab === 'Note' })}
              onClick={() => { this.toggle('Note'); }}
            >
              Note
            </NavLink>
          </NavItem>
        </Nav>
        <TabContent activeTab={activeTab}>
          <TabPane tabId="Chat">
            <ChatBox />
          </TabPane>
          <TabPane tabId="Description">
            <div className="p-3">{room.description}</div>
          </TabPane>
          <TabPane tabId="Note">
            <NoteBox />
          </TabPane>
        </TabContent>
      </Resizable>
    );
  }
}

const mapStateToProps = (state) => ({
  activeTab: state.sidebar.activeTab,
  room: state.room,
  chat: state.chat,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  setActiveTab: actions.setActiveTab,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Sidebar);
