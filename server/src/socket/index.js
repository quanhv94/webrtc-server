import socketIO from 'socket.io';

const rooms = {};

const setupSocket = (server) => {
  const io = socketIO(server);
  io.on('connection', (socket) => {
    socket.on('join', ({ room, username }) => {
      rooms[room] = rooms[room] || {};
      if (rooms[room][username]) {
        socket.emit('join-error', 'Bạn đang đăng nhập tại một trình duyệt khác');
      } else if (Object.keys(rooms[room]).length >= 2) {
        socket.emit('join-error', 'Phòng này đã đầy');
      } else {
        socket.room = room;
        socket.username = username;
        socket.join(room);
        rooms[room][username] = socket.id;
        io.in(room).emit('peers', rooms[room]);
        socket.send({ type: 'success', content: `Xin chào ${username}` });
        socket.to(room).broadcast.send({ type: 'success', content: `${username} vừa vào phòng` });
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
