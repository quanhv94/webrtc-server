import { combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';
import metadataReducer from './metadata/reducer';
import appReducer from './app/reducer';
import chatReducer from './chat/reducer';
import partnerReducer from './partner/reducer';
import partnerConfigReducer from './partnerConfig/reducer';
import userReducer from './user/reducer';
import userConfigReducer from './userConfig/reducer';
import errorReducer from './error/reducer';
import roomReducer from './room/reducer';
import sidebarReducer from './sidebar/reducer';

const rootReducer = combineReducers({
  form: formReducer,
  metadata: metadataReducer,
  app: appReducer,
  chat: chatReducer,
  partner: partnerReducer,
  partnerConfig: partnerConfigReducer,
  user: userReducer,
  userConfig: userConfigReducer,
  error: errorReducer,
  room: roomReducer,
  sidebar: sidebarReducer,
});

export default rootReducer;
