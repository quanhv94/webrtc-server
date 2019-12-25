import socketIO from 'socket.io';
import AWS from 'aws-sdk';
import moment from 'moment-timezone';
import request from 'request-promise';

const checkRoom = async ({ domain, roomCode, token, role }) => {
  try {
    const uri = `${domain}/api/v1/class-lecture/load-data?lectureId=${roomCode}&role=${role}&token=${token}`;
    console.log(uri);
    const response = await request({
      uri,
      json: true,
    });
    const { data } = response;
    if (!data.success) {
      const { message } = data;
      return { error: message };
    }
    const { user, configs, lecture, instance } = data.data;
    const { storageConfig, chatRoomConfig, toolConfig } = lecture;
    const room = {
      configs,
      name: lecture.class.name,
      description: lecture.class.description,
      plan_start_datetime: moment.tz(lecture.plan_start_datetime, 'Asia/Ho_Chi_Minh').format(),
      plan_duration: lecture.plan_duration,
      instance,
    };
    return { user, room, storageConfig, chatRoomConfig, toolConfig };
  } catch {
    return { error: 'Can\'t connect to server' };
  }
};

const rooms = {};

const setupSocket = (server) => {
  const io = socketIO(server);
  io.on('connection', (socket) => {
    socket.data = {};
    socket.on('join', async ({ domain, token, roomCode, role }) => {
      socket.data.domain = domain;
      socket.data.token = token;
      socket.data.roomCode = roomCode;
      socket.data.role = role;
      rooms[roomCode] = rooms[roomCode] || {};
      const roomData = await checkRoom({ domain, token, roomCode, role });
      const { user, room, storageConfig, chatRoomConfig, toolConfig, error } = roomData;
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
        socket.data.userId = userId;
        socket.data.user = user;
        socket.data.room = room;
        socket.data.storageConfig = storageConfig;
        socket.data.chatRoomConfig = chatRoomConfig;
        socket.data.toolConfig = toolConfig;
        socket.join(roomCode);
        rooms[roomCode][userId] = socket.id;
        socket.emit('join-success', {
          user,
          room,
          storageConfig,
          chatRoomConfig,
          toolConfig,
          currentTime: moment().format(),
        });
        socket.emit('toast', { type: 'success', content: `Hello ${user.full_name}` });
        socket.to(roomCode).broadcast.emit('toast', { type: 'success', content: `${user.full_name} joined` });
        if (Object.keys(rooms[roomCode]).length >= 2) {
          io.in(roomCode).emit('make-peer', { callerId: userId });
          io.in(roomCode).emit('partner-join', true);
        }
      }
    });

    const leave = () => {
      try {
        const { roomCode, userId, user } = socket.data;
        if (rooms[roomCode] && rooms[roomCode][userId]) {
          delete rooms[roomCode][userId];
          socket.leave(roomCode);
          io.to(roomCode).emit('partner-leave', userId);
          io.to(roomCode).emit('toast', { type: 'error', content: `${user.full_name} leaved` });
        }
      } catch (e) {
        console.log('error', e);
      }
    };

    socket.on('leave', leave);
    socket.on('disconnect', leave);
    socket.on('rtc-signal', (data) => {
      io.in(socket.data.roomCode).emit('rtc-signal', data);
    });
    socket.on('chat-message', (message) => {
      try {
        message.sentAt = moment().format();
        message.sender = socket.data.chatRoomConfig.sender;
        io.in(socket.data.roomCode).emit('chat-message', message);
      } catch (e) {
        console.log('error', e);
      }
    });
    socket.on('request-s3-presigned-url', ({ key }) => {
      try {
        const { storageConfig } = socket.data;
        const s3Config = storageConfig.configs;
        const accessKeyId = s3Config.s3_key;
        const secretAccessKey = s3Config.s3_secret;
        const region = s3Config.s3_region;
        const bucket = s3Config.s3_default_bucket;
        const keyWithPrefix = `${storageConfig.roomStorageRef}/${key}`;
        const s3 = new AWS.S3({
          signatureVersion: 'v4',
          accessKeyId,
          secretAccessKey,
          region,
        });
        const presignedUrl = s3.getSignedUrl('putObject', {
          Bucket: bucket,
          Key: keyWithPrefix,
          Expires: 3600,
          ACL: 'public-read',
        });
        console.log(accessKeyId, secretAccessKey, region, keyWithPrefix);
        socket.emit(`success-s3-presigned-url_${key}`, { presignedUrl, path: keyWithPrefix });
      } catch {
        socket.emit(`error-s3-presigned-url_${key}`);
      }
    });
  });
};

export default setupSocket;
