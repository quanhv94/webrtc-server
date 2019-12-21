import { createAction } from 'redux-actions';
import types from './types';

const actions = {
  appendMessage: createAction(types.APPEND_MESSAGE),
  prependMessage: createAction(types.PREPEND_MESSAGE),
  setTotalUnread: createAction(types.SET_TOTAL_UNREAD),
};

export default actions;
