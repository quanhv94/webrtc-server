
import io from 'socket.io-client';
import constants from '../config/constants';

const socket = io(constants.apiHost);

export default socket;
