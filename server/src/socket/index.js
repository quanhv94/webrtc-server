import socketIO from 'socket.io';
import moment from 'moment';
import uuid from 'uuid/v4';
import request from 'request-promise';

const checkRoom = async ({ domain, roomCode, token, role }) => {
  if (roomCode.startsWith('rabita') && ['1', '2'].includes(token)) {
    return {
      room: {
        id: 100,
        name: 'Lớp học vui vẻ',
        description: 'Đây là mô tả room',
      },
      user: {
        user_id: token,
        full_name: token === 1 ? 'Teacher Ben' : 'Nguyen Duy Hieu',
        email: 'ben@rabita.vn',
        phone_number: '0987878787',
        role: token === 1 ? 'TEACHER' : 'STUDENT',
      },
    };
  }
  try {
    const uri = `${domain}/api/v1/class-lecture/load-data?lectureId=${roomCode}&role=${role}&token=${token}`;
    const response = await request({
      uri,
      json: true,
    });
    const { data } = response;
    if (!data.success) {
      const { message } = data;
      return { error: message };
    }
    const { user, configs, lecture } = data.data;
    const room = {
      configs,
      name: lecture.class.name,
      description: lecture.class.description,
      chatRoomConfig: lecture.chatRoomConfig,
    };
    return { user, room };
  } catch {
    return { error: 'Can not connect to server' };
  }
};

const rooms = {};

const setupSocket = (server) => {
  const io = socketIO(server);
  io.on('connection', (socket) => {
    socket.on('join', async ({ domain, token, roomCode, role }) => {
      rooms[roomCode] = rooms[roomCode] || {};
      const { user, room, error } = await checkRoom({ domain, token, roomCode, role });
      if (error) {
        socket.emit('join-error', error);
        return;
      }
      const userId = user.user_id;

      if (rooms[roomCode][userId]) {
        socket.emit('join-error', 'You logged in at another browser');
      } else if (Object.keys(rooms[roomCode]).length >= 2) {
        socket.emit('join-error', 'This room is full');
      } else {
        socket.roomCode = roomCode;
        socket.userId = userId;
        socket.user = user;
        socket.join(roomCode);
        rooms[roomCode][userId] = socket.id;
        socket.emit('join-success', { user, room });
        socket.emit('toast', { type: 'success', content: `Hello ${user.full_name}` });
        socket.to(roomCode).broadcast.emit('toast', { type: 'success', content: `${user.full_name} joined` });
        if (Object.keys(rooms[roomCode]).length >= 2) {
          io.in(socket.roomCode).emit('make-peer', { callerId: userId });
          io.in(socket.roomCode).emit('partner-join', true);
        }
      }
    });

    const leave = () => {
      const { roomCode, userId, user } = socket;
      if (rooms[roomCode] && rooms[roomCode][userId]) {
        delete rooms[roomCode][userId];
        socket.leave(roomCode);
        io.to(roomCode).emit('partner-leave', userId);
        io.to(roomCode).emit('toast', { type: 'error', content: `${user.full_name} leaved` });
      }
    };

    socket.on('leave', leave);
    socket.on('disconnect', leave);
    socket.on('rtc-signal', (data) => {
      io.in(socket.roomCode).emit('rtc-signal', data);
    });
    socket.on('chat-message', (message) => {
      message.id = uuid();
      message.sender = socket.user;
      message.time = moment().format();
      io.in(socket.roomCode).emit('chat-message', message);
    });
  });
};

export default setupSocket;
