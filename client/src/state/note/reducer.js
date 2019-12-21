import { handleActions } from 'redux-actions';
import types from './types';

const initialState = {
  notes: [],
};

const actions = {
  [types.SET_NOTES]: (state, action) => ({ ...state, notes: action.payload }),
  [types.UPDATE_NOTE_CONTENT]: (state, action) => {
    const { notes } = state;
    const { userId, content } = action.payload;
    const newNotes = notes.map((x) => (x.userId === userId ? ({ ...x, content }) : x));
    return { ...state, notes: newNotes };
  },
};
export default handleActions(actions, initialState);
