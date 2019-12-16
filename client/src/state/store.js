import { createStore, applyMiddleware } from 'redux';
import { createLogger } from 'redux-logger';
import rootReducer from './rootReducer';
import LocalStorage from '../util/LocalStorage';

const logger = createLogger({ collapsed: true });
const middlewares = [];
if (process.env.NODE_ENV === 'development') {
  middlewares.push(logger);
}
const store = createStore(
  rootReducer,
  applyMiddleware(...middlewares),
);
store.subscribe(() => {
  const state = store.getState();
  const user = state.user.profile;
  if (user) {
    LocalStorage.saveUserConfig(user.id, state.userConfig);
  }
});
export default store;
