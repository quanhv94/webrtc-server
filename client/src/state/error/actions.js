import { createAction } from 'redux-actions';
import types from './types';

const actions = {
  setError: createAction(types.SET_ERROR),
};

export default actions;
