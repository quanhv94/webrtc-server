import { createAction } from 'redux-actions';
import types from './types';

const actions = {
  setCurrentUser: createAction(types.SET_CURRENT_USER),
};

export default actions;
