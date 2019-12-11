import socketIO from 'socket.io';
import request from 'request-promise';

const rooms = {};

const setupSocket = (server) => {
  const io = socketIO(server);
  io.on('connection', (socket) => {
    socket.on('join', async ({ room, username }) => {
      rooms[room] = rooms[room] || {};
      const response = await request({
        uri: `http://test.e-school.rabita.vn:80/api/v1/meeting-room/room-data?roomCode=${room}&userId=${username}`,
        json: true,
      });
      if (!response.data.success) {
        socket.emit('join-error', response.data.message);
        return;
      }
      const { user } = response.data.data;
      if (rooms[room][username]) {
        socket.emit('join-error', 'You logged in at another browser');
      } else if (Object.keys(rooms[room]).length >= 2) {
        socket.emit('join-error', 'This room is full');
      } else {
        socket.room = room;
        socket.username = username;
        socket.join(room);
        rooms[room][username] = socket.id;
        io.in(room).emit('peers', rooms[room]);
        socket.send({ type: 'success', content: `Hello ${user.full_name}` });
        socket.to(room).broadcast.send({ type: 'success', content: `${user.full_name} joined` });
        if (Object.keys(rooms[room]).length === 2) {
          io.in(socket.room).emit('start-call', username);
        }
      }
    });

    const leave = () => {
      const { room, username } = socket;
      if (rooms[room] && rooms[room][username]) {
        delete rooms[room][username];
        socket.leave(room);
        io.to(room).emit('peers', rooms[room]);
        io.to(room).send({ type: 'error', content: `${username} đã rời phòng` });
      }
    };

    socket.on('leave', leave);
    socket.on('disconnect', leave);
    socket.on('rtc-signal', (data) => {
      io.in(socket.room).emit('rtc-signal', data);
    });
  });
};

export default setupSocket;
