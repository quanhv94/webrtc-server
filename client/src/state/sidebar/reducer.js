import { handleActions } from 'redux-actions';
import types from './types';

const initialState = {
  activeTab: 'Chat',
};

const actions = {
  [types.SET_ACTIVE_TAB]: (state, action) => ({ ...state, activeTab: action.payload }),
};
export default handleActions(actions, initialState);
