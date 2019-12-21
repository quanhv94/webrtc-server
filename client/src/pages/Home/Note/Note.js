import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Input } from 'reactstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import actions from '../../../state/note/actions';
import peerClient from '../../../util/WebRTCClient';
import './style.scss';

class Note extends React.Component {
  static propTypes = {
    currentUser: PropTypes.object,
    notes: PropTypes.array.isRequired,
    setNotes: PropTypes.func.isRequired,
    updateNoteContent: PropTypes.func.isRequired,
  }

  static defaultProps = {
    currentUser: null,
  }

  constructor(props) {
    super(props);
    this.saveNote = _.debounce(this.saveNote, 1000);
  }

  componentDidMount() {
    const { setNotes, updateNoteContent } = this.props;
    peerClient.on('set-notes', (notes) => {
      setNotes(notes);
    });
    peerClient.on('update-note', ({ userId, content }) => {
      updateNoteContent({ userId, content });
    });
  }

  saveNote = (content) => {
    peerClient.updateNoteContent(content);
  }

  onChange = (e) => {
    const { updateNoteContent, currentUser } = this.props;
    const userId = currentUser.user_id;
    const content = e.target.value;
    updateNoteContent({ userId, content });
    this.saveNote(content);
  }

  render() {
    const { notes, currentUser } = this.props;
    return (
      <div className="notes-container">
        {notes.map((note) => (
          <div key={note.userId} className="note">
            <div className="nav-link">{note.first_name}</div>
            <div className="note-content">
              <Input
                type="textarea"
                name={note.userId}
                value={note.content || ''}
                onChange={this.onChange}
                readOnly={note.userId !== currentUser.user_id}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
}


const mapStateToProps = (state) => ({
  notes: state.note.notes,
  currentUser: state.user.profile,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  setNotes: actions.setNotes,
  updateNoteContent: actions.updateNoteContent,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Note);
