
import io from 'socket.io-client';
import constants from '../config/constants';

const socket = io(constants.apiHost, { secure: true });

export default socket;
