import { createStore, applyMiddleware } from 'redux';
import { createLogger } from 'redux-logger';
import rootReducer from './rootReducer';

const logger = createLogger({ collapsed: true });
const middlewares = [];
if (process.env.NODE_ENV === 'development') {
  middlewares.push(logger);
}
const store = createStore(
  rootReducer,
  applyMiddleware(...middlewares),
);
export default store;
