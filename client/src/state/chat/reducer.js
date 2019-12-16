import { handleActions } from 'redux-actions';
import _ from 'lodash';
import types from './types';

const initialState = {
  messages: [],
};

const actions = {
  [types.APPEND_MESSAGE]: (state, action) => {
    const messages = _.concat(state.messages, action.payload);
    return { ...state, messages };
  },
};
export default handleActions(actions, initialState);
