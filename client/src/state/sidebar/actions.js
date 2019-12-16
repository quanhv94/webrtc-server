import { createAction } from 'redux-actions';
import types from './types';

const actions = {
  setActiveTab: createAction(types.SET_ACTIVE_TAB),
};

export default actions;
