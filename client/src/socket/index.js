
import io from 'socket.io-client';
import constants from '../config/constants';

const socket = io.connect(constants.apiHost, { secure: true, reconnection: false });

export default socket;
