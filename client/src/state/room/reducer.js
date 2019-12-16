import { handleActions } from 'redux-actions';
import types from './types';

const initialState = {
};

const actions = {
  [types.SET_ROOM]: (state, action) => ({ ...state, ...action.payload }),
};
export default handleActions(actions, initialState);
