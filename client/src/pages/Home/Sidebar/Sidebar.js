import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Resizable } from 're-resizable';
import classnames from 'classnames';
import PropType from 'prop-types';
import { TabContent, TabPane, Nav, NavItem, NavLink } from 'reactstrap';
import actions from '../../../state/sidebar/actions';
import ChatBox from '../Chat/Chat';
import './sidebar.scss';


class Sidebar extends React.Component {
  static propTypes = {
    setActiveTab: PropType.func.isRequired,
    activeTab: PropType.string.isRequired,
    room: PropType.object.isRequired,
  }

  toggle = (tab) => {
    const { setActiveTab } = this.props;
    setActiveTab(tab);
  }

  render() {
    const { activeTab, room } = this.props;
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
            <ChatBox />
          </TabPane>
          <TabPane tabId="Description">
            <div className="p-3">{room.description}</div>
          </TabPane>
        </TabContent>
      </Resizable>
    );
  }
}

const mapStateToProps = (state) => ({
  activeTab: state.sidebar.activeTab,
  room: state.room,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  setActiveTab: actions.setActiveTab,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Sidebar);
