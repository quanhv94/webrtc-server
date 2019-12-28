import socketIO from 'socket.io';
import AWS from 'aws-sdk';
import _ from 'lodash';
import moment from 'moment-timezone';
import request from 'request-promise';

const checkRoom = async ({ domain, roomCode, token, role }) => {
  try {
    let uri = `${domain}/api/v1/class-lecture/load-data?lectureId=${roomCode}&role=${role}&token=${token}`;
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
    const { user, lecture, instance } = data.data;
    const { storageConfig, chatRoomConfig, toolConfig, teacher, student } = lecture;
    const roomDetail = {
      name: lecture.class.name,
      description: lecture.class.description,
      plan_start_datetime: moment.tz(lecture.plan_start_datetime, 'Asia/Ho_Chi_Minh').format(),
      plan_duration: lecture.plan_duration,
      instance,
    };
    return { user, roomDetail, storageConfig, chatRoomConfig, toolConfig, teacher, student };
  } catch {
    return { error: 'Can\'t connect to server' };
  }
};

const rooms = {};
const createRoom = (roomCode) => {
  if (!rooms[roomCode]) {
    rooms[roomCode] = {
      hasTeacher: false,
      hasStudent: false,
      users: [],
    };
  }
};
const deleteRoom = (roomCode) => {
  delete rooms[roomCode];
};

/**
 *
 * @return {{
 *   hasTeacher: boolean,
 *   hasStudent: boolean,
 *   users: Array,
 *   detail: Object,
 *   storageConfig: Object
 * }}
 */
const getRoom = (roomCode) => rooms[roomCode];
const addUserToRoom = (roomCode, user) => {
  const room = getRoom(roomCode);
  room.users.push(user);
  if (user.role === 'TEACHER') {
    room.hasTeacher = true;
  } else if (user.role === 'STUDENT') {
    room.hasStudent = true;
  }
};

const removeUserFromRoom = (roomCode, user) => {
  const room = getRoom(roomCode);
  room.users = room.users.filter((x) => x.user_id !== user.user_id);
  if (user.role === 'TEACHER') {
    room.hasTeacher = false;
  } else if (user.role === 'STUDENT') {
    room.hasStudent = false;
  }
  if (room.users.length === 0) {
    deleteRoom(roomCode);
  }
};

const setRoomDetail = (roomCode, detail) => {
  const room = getRoom(roomCode);
  room.detail = detail;
};

const setRoomStorageConfig = (roomCode, storageConfig) => {
  const room = getRoom(roomCode);
  room.storageConfig = storageConfig;
};

const isUserJoinedRoom = (roomCode, user) => {
  const room = getRoom(roomCode);
  if (!room) return false;
  const isJoined = (_.find(room.users, (x) => x.user_id === user.user_id));
  return isJoined;
};

const setupSocket = (server) => {
  const io = socketIO(server);
  io.on('connection', (socket) => {
    socket.data = {};
    socket.on('join', async ({ domain, token, roomCode, role }) => {
      socket.data.roomCode = roomCode;
      const roomData = await checkRoom({ domain, token, roomCode, role });
      const {
        user,
        roomDetail,
        storageConfig,
        chatRoomConfig,
        toolConfig,
        error,
        teacher,
        student,
      } = roomData;
      user.socketId = socket.id;
      if (error) {
        socket.emit('join-error', error);
        return;
      }
      if (isUserJoinedRoom(roomCode, user)) {
        socket.emit('join-error', 'You logged in at another browser');
      } else {
        socket.data.user = user;
        socket.join(roomCode);
        createRoom(roomCode);
        addUserToRoom(roomCode, user);
        setRoomDetail(roomCode, roomDetail);
        setRoomStorageConfig(roomCode, storageConfig);
        socket.emit('join-success', {
          user,
          roomDetail,
          storageConfig,
          chatRoomConfig,
          toolConfig,
          currentTime: moment().format(),
          teacher,
          student,
        });
        const room = getRoom(roomCode);
        io.in(roomCode).emit('make-peer', {
          initiatorSocketId: socket.id,
          users: room.users,
        });
        if (room.hasStudent && room.hasTeacher) {
          io.to(roomCode).emit('partner-joined', true);
        }
      }
    });

    const leave = () => {
      try {
        const { roomCode, user } = socket.data;
        if (!roomCode || !user) return;
        io.to(roomCode).emit('leave', {
          leaverSocketId: socket.id,
          leaverId: user.user_id,
          leaver: user,
        });
        removeUserFromRoom(roomCode, user);
        const room = getRoom(roomCode);
        if (!room) return;
        if (!room.hasStudent || !room.hasTeacher) {
          io.to(roomCode).emit('partner-left');
        }
      } catch (e) {
        console.log('error', e);
      }
    };

    socket.on('leave', leave);
    socket.on('disconnect', leave);

    socket.on('rtc-signal', (data) => {
      io.to(socket.data.roomCode).emit('rtc-signal', data);
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
        const { roomCode } = socket.data;
        const room = getRoom(roomCode);
        const { storageConfig } = room;
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
    socket.on('turn-camera', (data) => {
      io.to(socket.data.roomCode).emit('turn-camera', data);
    });
    socket.on('turn-microphone', (data) => {
      io.to(socket.data.roomCode).emit('turn-microphone', data);
    });
    socket.on('screen-stream-ended', (data) => {
      io.to(socket.data.roomCode).emit('screen-stream-ended', data);
    });
  });
};

export default setupSocket;
