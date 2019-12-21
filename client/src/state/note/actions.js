import { createAction } from 'redux-actions';
import types from './types';

const actions = {
  setNotes: createAction(types.SET_NOTES),
  updateNoteContent: createAction(types.UPDATE_NOTE_CONTENT),
};

export default actions;
