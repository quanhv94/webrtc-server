import { handleActions } from 'redux-actions';
import types from './types';

const initialState = {
  profile: null,
};

const actions = {
  [types.SET_PARTNER]: (state, action) => ({ ...state, profile: action.payload }),
};
export default handleActions(actions, initialState);
