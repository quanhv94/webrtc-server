import { handleActions } from 'redux-actions';
import types from './types';

const initialState = {
  message: '',
};

const actions = {
  [types.SET_ERROR]: (state, action) => ({ ...state, message: action.payload }),
};
export default handleActions(actions, initialState);
