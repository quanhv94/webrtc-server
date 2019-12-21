import { handleActions } from 'redux-actions';
import _ from 'lodash';
import types from './types';

const initialState = {
  messages: [],
  totalUnread: 0,
};

const actions = {
  [types.APPEND_MESSAGE]: (state, action) => {
    const messages = _.concat(state.messages, action.payload);
    return { ...state, messages };
  },
  [types.SET_TOTAL_UNREAD]: (state, action) => ({
    ...state,
    totalUnread: action.payload,
  }),
};
export default handleActions(actions, initialState);
