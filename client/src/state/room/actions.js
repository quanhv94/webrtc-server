import { createAction } from 'redux-actions';
import types from './types';

const actions = {
  setRoom: createAction(types.SET_ROOM),
};

export default actions;
