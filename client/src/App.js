/* eslint-disable react/no-danger */
import React from 'react';
import {
  Router,
  Route,
  Switch,
  Redirect,
} from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Provider } from 'react-redux';
import { ThroughProvider } from 'react-through';
import { ToastContainer, toast } from 'react-toastify';
import { Modal, ModalBody } from 'reactstrap';
import I18n from 'i18n-js';
import translations from './i18n/locale.json';
import Login from './pages/Login/Login';
import Home from './pages/Home/Home';
import View from './pages/View/View';
import store from './state/store';
import history from './history';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import 'react-confirm-alert/src/react-confirm-alert.css';
import 'simple-line-icons/css/simple-line-icons.css';
import 'rc-tree/assets/index.css';
import './app.scss';
import 'react-tagsinput/react-tagsinput.css';


I18n.translations = translations;
I18n.fallbacks = true;
I18n.locale = (navigator.language || navigator.userLanguage || 'en').split('-').shift();

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isChrome: (!!window.chrome) || navigator.userAgent.match('CriOS') || true,
    };
  }

  render() {
    const { isChrome } = this.state;
    return (
      <Provider store={store}>
        <ThroughProvider>
          <div className="App">
            <Helmet>
              <title>Rabita Call</title>
            </Helmet>
            {isChrome && (
              <Router history={history}>
                <Switch>
                  <Route exact path="/" component={Login} />
                  <Route exact path="/learn" component={Home} />
                  <Route exact path="/view" component={View} />
                  <Redirect to="/" />
                </Switch>
              </Router>
            )}
            <ToastContainer
              hideProgressBar
              position={toast.POSITION.TOP_CENTER}
              closeButton={false}
            />
          </div>
        </ThroughProvider>
        <Modal isOpen={!isChrome} zIndex="3600" backdropClassName="black">
          <ModalBody className="text-center">
            <p dangerouslySetInnerHTML={{ __html: I18n.t('message-browserSupport') }} />
            <a href="https://www.google.com/chrome">
              <img src="https://www.google.com/chrome/static/images/chrome-logo.svg" alt="chrome logo" />
              <p>Download Chrome</p>
            </a>
          </ModalBody>
        </Modal>
      </Provider>
    );
  }
}

export default App;
