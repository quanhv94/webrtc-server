import { createAction } from 'redux-actions';
import types from './types';

const actions = {
  setMicrophone: createAction(types.SET_MICROPHONE),
  setCamera: createAction(types.SET_CAMERA),
  setShareScreen: createAction(types.SET_SHARE_SCREEN),
};

export default actions;
