import { createAction } from 'redux-actions';
import types from './types';

const actions = {
  appendMessage: createAction(types.APPEND_MESSAGE),
  prependMessage: createAction(types.PREPEND_MESSAGE),
};

export default actions;
