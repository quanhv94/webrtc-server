import socketIO from 'socket.io';
import request from 'request-promise';

const checkRoom = async ({ roomCode, userId }) => {
  if (roomCode === 'roomCode1') {
    return {
      room: {},
      user: { full_name: userId },
    };
  }
  try {
    const response = await request({
      uri: `http://test.e-school.rabita.vn:80/api/v1/meeting-room/room-data?roomCode=${roomCode}&userId=${userId}`,
      json: true,
    });
    const { data } = response;
    if (!data.success) {
      const { message } = data;
      return { error: message };
    }
    const { user, room } = data.data;
    return { user, room };
  } catch {
    return { error: 'Can not connect to server' };
  }
};

const rooms = {};

const setupSocket = (server) => {
  const io = socketIO(server);
  io.on('connection', (socket) => {
    socket.on('join', async ({ roomCode, userId }) => {
      rooms[roomCode] = rooms[roomCode] || {};
      const { user, error } = await checkRoom({ roomCode, userId });
      if (error) {
        socket.emit('join-error', error);
        return;
      }

      if (rooms[roomCode][userId]) {
        socket.emit('join-error', 'You logged in at another browser');
      } else if (Object.keys(rooms[roomCode]).length >= 2) {
        socket.emit('join-error', 'This room is full');
      } else {
        socket.roomCode = roomCode;
        socket.userId = userId;
        socket.join(roomCode);
        rooms[roomCode][userId] = socket.id;
        io.in(roomCode).emit('peers', rooms[roomCode]);
        socket.send({ type: 'success', content: `Hello ${user.full_name}` });
        socket.to(roomCode).broadcast.send({ type: 'success', content: `${user.full_name} joined` });
        if (Object.keys(rooms[roomCode]).length === 2) {
          io.in(socket.roomCode).emit('start-call', userId);
        }
      }
    });

    const leave = () => {
      const { roomCode, userId } = socket;
      if (rooms[roomCode] && rooms[roomCode][userId]) {
        delete rooms[roomCode][userId];
        socket.leave(roomCode);
        io.to(roomCode).emit('peers', rooms[roomCode]);
        io.to(roomCode).send({ type: 'error', content: `${userId} đã rời phòng` });
      }
    };

    socket.on('leave', leave);
    socket.on('disconnect', leave);
    socket.on('rtc-signal', (data) => {
      io.in(socket.roomCode).emit('rtc-signal', data);
    });
  });
};

export default setupSocket;
