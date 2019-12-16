import { handleActions } from 'redux-actions';
import types from './types';

const initialState = {
  microphoneOn: true,
  cameraOn: true,
  shareScreenOn: false,
};

const actions = {
  [types.SET_MICROPHONE]: (state, action) => ({ ...state, microphoneOn: action.payload }),
  [types.SET_CAMERA]: (state, action) => ({ ...state, cameraOn: action.payload }),
  [types.SET_SHARE_SCREEN]: (state, action) => ({ ...state, shareScreenOn: action.payload }),
};
export default handleActions(actions, initialState);
