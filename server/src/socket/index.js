import socketIO from 'socket.io';
import AWS from 'aws-sdk';
import _ from 'lodash';
import delay from 'delay';
import moment from 'moment-timezone';
import request from 'request-promise';

const checkRoom = async ({ domain, lessonId, token, role }) => {
  try {
    const uri = `${domain}/api/v1/class-lecture/load-data?lectureId=${lessonId}&role=${role}&token=${token}`;
    const response = await request({
      uri,
      json: true,
    });
    console.log(uri);
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
  } catch (e) {
    return { error: 'Can\'t connect to server' };
  }
};

const isTeacherOrStudent = (user) => (user.role && ['TEACHER', 'STUDENT'].includes(user.role));

const rooms = {};
const createRoomIfNotExits = (lessonId) => {
  if (!rooms[lessonId]) {
    rooms[lessonId] = {
      hasTeacher: false,
      hasStudent: false,
      users: [],
    };
  }
};
const deleteRoom = (lessonId) => {
  delete rooms[lessonId];
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
const getRoom = (lessonId) => rooms[lessonId];
const addUserToRoom = (lessonId, user) => {
  const room = getRoom(lessonId);
  room.users.push(user);
  if (user.role === 'TEACHER') {
    room.hasTeacher = true;
  } else if (user.role === 'STUDENT') {
    room.hasStudent = true;
  }
};

const removeUserFromRoom = (lessonId, user) => {
  const room = getRoom(lessonId);
  if (!room) return;
  room.users = room.users.filter((x) => x.user_id !== user.user_id);
  if (user.role === 'TEACHER') {
    room.hasTeacher = false;
  } else if (user.role === 'STUDENT') {
    room.hasStudent = false;
  }
  if (room.users.length === 0) {
    deleteRoom(lessonId);
  }
};

const setRoomDetail = (lessonId, detail) => {
  const room = getRoom(lessonId);
  room.detail = detail;
};

const setRoomStorageConfig = (lessonId, storageConfig) => {
  const room = getRoom(lessonId);
  room.storageConfig = storageConfig;
};

const isUserJoinedRoom = (lessonId, user) => {
  const room = getRoom(lessonId);
  if (!room) return null;
  const joinedUser = (_.find(room.users, (x) => x.user_id === user.user_id));
  return joinedUser;
};

const logUserAction = ({ domain, token, lessonId, userId, action = 'IN' }) => {
  const uri = `${domain}/api/v1/class-lecture/save-data?token=${token}&lectureId=${lessonId}`;
  const actualLog = JSON.stringify({ action, userId });
  request({
    uri,
    method: 'POST',
    form: {
      actual_log: actualLog,
    },
  }).then((res) => console.log(res, action));
};
/**
 *
 * @param {socketIO.Server} io
 * @param {socketIO.Socket} socket
 */
const socketLeave = (io, socket) => {
  try {
    const { lessonId, user, domain, token } = socket.data;
    socket.data = {};
    if (!lessonId || !user) return;
    io.to(lessonId).emit('leave', {
      leaverSocketId: socket.id,
      leaverId: user.user_id,
      leaver: user,
    });
    removeUserFromRoom(lessonId, user);
    socket.leave(lessonId);
    logUserAction({ domain, token, lessonId, action: 'OUT' });
  } catch (e) {
    console.log('error', e);
  }
};

const setupSocket = (server) => {
  const io = socketIO(server);
  io.on('connection', (socket) => {
    socket.data = {};
    socket.on('get-user-info', async ({ domain, token, lessonId, role }) => {
      const roomData = await checkRoom({ domain, token, lessonId, role });
      const language = _.get(roomData, 'roomDetail.instance.language', 'en');
      const { user, error } = roomData;
      if (user) {
        socket.emit('get-user-info', { user, language });
      } else {
        socket.emit('error-message', error);
      }
    });
    socket.on('join', async ({ domain, token, lessonId, role }) => {
      socket.data.domain = domain;
      socket.data.lessonId = lessonId;
      socket.data.token = token;
      const roomData = await checkRoom({ domain, token, lessonId, role });
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
      if (error) {
        socket.emit('error-message', error);
        return;
      }
      user.socketId = socket.id;

      // close old connection of same user if exist
      const joinedUser = isUserJoinedRoom(lessonId, user);
      if (joinedUser) {
        const joinedSocket = io.sockets.connected[joinedUser.socketId];
        socketLeave(io, joinedSocket);
        await delay(1000);
      }

      socket.data.user = user;
      socket.join(lessonId);
      createRoomIfNotExits(lessonId);
      addUserToRoom(lessonId, user);
      setRoomDetail(lessonId, roomDetail);
      setRoomStorageConfig(lessonId, storageConfig);
      logUserAction({ domain, token, lessonId, userId: user.user_id, action: 'IN' });
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
      const room = getRoom(lessonId);
      io.in(lessonId).emit('make-peer', {
        initiatorSocketId: socket.id,
        users: room.users,
      });
      if (room.hasStudent && room.hasTeacher && isTeacherOrStudent(user)) {
        io.to(lessonId).emit('partner-joined', true);
      }
    });


    socket.on('leave', () => socketLeave(io, socket));
    socket.on('disconnect', () => socketLeave(io, socket));

    socket.on('rtc-signal', (data) => {
      io.to(socket.data.lessonId).emit('rtc-signal', data);
    });
    socket.on('chat-message', (message) => {
      try {
        message.sentAt = moment().format();
        message.sender = socket.data.chatRoomConfig.sender;
        io.in(socket.data.lessonId).emit('chat-message', message);
      } catch (e) {
        console.log('error', e);
      }
    });
    socket.on('request-s3-presigned-url', ({ key }) => {
      try {
        const { lessonId } = socket.data;
        const room = getRoom(lessonId);
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
        socket.emit(`success-s3-presigned-url_${key}`, { presignedUrl, path: keyWithPrefix });
      } catch {
        socket.emit(`error-s3-presigned-url_${key}`);
      }
    });
    socket.on('turn-camera', (data) => {
      io.to(socket.data.lessonId).emit('turn-camera', data);
    });
    socket.on('turn-microphone', (data) => {
      io.to(socket.data.lessonId).emit('turn-microphone', data);
    });
    socket.on('screen-stream-ended', (data) => {
      io.to(socket.data.lessonId).emit('screen-stream-ended', data);
    });
  });
};

export default setupSocket;
