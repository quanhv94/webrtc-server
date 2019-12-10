import { combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';
import metadataReducer from './metadata/reducer';

const rootReducer = combineReducers({
  form: formReducer,
  metadata: metadataReducer,
});

export default rootReducer;
