import { createAction } from 'redux-actions';
import types from './types';

const actions = {
  setPartner: createAction(types.SET_PARTNER),
};

export default actions;
