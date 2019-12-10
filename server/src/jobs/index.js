import Agenda from 'agenda';
import path from 'path';
import fs from 'fs';
import _ from 'lodash';
import moment from 'moment';
import uiza from 'uiza';
import mongoS3 from 'mongo-backup-s3';
import constants from '../config/constants';
import Course from '../models/course';
import File, { fileStatuses, fileStorages } from '../models/file';
import Lesson from '../models/lesson';
import Section from '../models/section';
import Document, { documentStatuses, documentPlayerTypes, documentTypes } from '../models/document';
import GoogleDriveUtil from '../util/googleDrive';
import s3Util from '../util/s3';

uiza.authorization(constants.uiza.uizaApiToken);
uiza.workspace_api_domain(`https://${constants.uiza.uizaApiDomain}`);

const agenda = new Agenda({
  db: { address: constants.mongodbUrl },
  maxConcurrency: 1,
  defaultLockLifetime: 1000 * 60,
});
agenda.define('download lesson document from google drive', async (job, done) => {
  const {
    courseId,
    sectionId,
    lessonId,
    documentId,
    oauthToken,
    googleFileId,
    fileName,
  } = job.attrs.data;
  console.log(`Start: download lesson document from google drive, documentId: ${documentId}`);
  const course = await Course.findById(courseId);
  if (!course) return done(new Error(`Course Not Found: ${courseId}`));
  const section = await Section.findById(sectionId);
  if (!section) return done(new Error(`Section Not Found: ${sectionId}`));
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) return done(new Error(`Lesson Not Found: ${lessonId}`));
  const document = await Document.findById(documentId);
  if (!document) return done(new Error(`Document Not Found: ${documentId}`));
  try {
    const newFileName = `${new Date().getTime()}-${fileName}`;
    const savePath = path.join(constants.localStorageFolder, newFileName);
    await GoogleDriveUtil.download({ googleFileId, oauthToken, savePath });
    const file = await File.create({
      path: `courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/${newFileName.replace(/[^A-z0-9.]/g, '_')}`,
      extension: path.extname(fileName),
      size: fs.statSync(savePath).size,
      name: newFileName,
      originalName: fileName,
      status: fileStatuses.pending,
      storage: fileStorages.local,
    });
    const fileId = file._id;
    await Document.updateOne({ _id: documentId }, { fileId });
    agenda.now('upload lesson document', {
      courseId,
      sectionId,
      lessonId,
      documentId,
      fileId,
      localPath: savePath,
    });
    console.log(`Finish: download lesson document from google drive, documentId: ${documentId}`);
    return done();
  } catch (err) {
    await Document.updateOne({ _id: documentId }, {
      status: documentStatuses.error,
      errorMessage: `Error on downloading: ${err}`,
    });
    console.log(`Failed: download lesson document from google drive, documentId: ${documentId}`);
    return done(err);
  }
});

agenda.define('upload lesson document', { priority: 5 }, async (job, done) => {
  const {
    courseId,
    sectionId,
    lessonId,
    documentId,
    fileId,
    localPath,
  } = job.attrs.data;
  console.log(`Start: upload lesson document, documentId: ${documentId}`);
  const course = await Course.findById(courseId);
  if (!course) return done(new Error(`Course Not Found: ${courseId}`));
  const section = await Section.findById(sectionId);
  if (!section) return done(new Error(`Section Not Found: ${sectionId}`));
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) return done(new Error(`Lesson Not Found: ${lessonId}`));
  const document = await Document.findById(documentId);
  if (!document) return done(new Error(`Document Not Found: ${documentId}`));
  try {
    const file = await File.findById(fileId);
    await s3Util.putObjectStream(localPath, file.s3Path);
    file.storage = fileStorages.s3;
    await file.save();
    if (document.type !== documentTypes.video) {
      file.status = fileStatuses.ready;
      await file.save();
      document.status = documentStatuses.ready;
      await document.save();
      return done();
    }
    const params = {
      name: `[${constants.appName}][${constants.env}]${course._id}-${Date.now()}-${file.originalName}`,
      url: file.previewUrl,
      inputType: 'http',
    };
    const res = await uiza.entity.create(params);
    if (res.id) {
      document.status = documentStatuses.inprogress;
      document.players = [{
        playerType: documentPlayerTypes.uiza,
        playerData: {
          entityId: res.id,
          uizaApiDomain: constants.uiza.uizaApiDomain,
          uizaApiAppId: constants.uiza.uizaApiAppId,
          uizaApiToken: constants.uiza.uizaApiToken,
        },
      }];
      await document.save();
      await uiza.entity.publish(res.id);
    } else {
      document.status = documentStatuses.error;
      document.errorMessage = 'Error on uploading to uiza';
      await document.save();
    }
    console.log(`Finish: upload lesson document, documentId: ${documentId}, entityId: ${res.id}`);
    return done();
  } catch (err) {
    await Document.updateOne({ _id: documentId }, {
      status: documentStatuses.error,
      errorMessage: `Error on uploading to uiza: ${err}`,
    });
    return done(err);
  }
});

agenda.define('update uiza video publish status', { priority: 10 }, async (job, done) => {
  const { documentId } = job.attrs.data;
  console.log(`Start: update uiza video publish status, documentId: ${documentId}`);
  const document = await Document.findById(documentId);
  if (!document) {
    return done(new Error('Error: video not found'));
  }
  if (document.status !== documentStatuses.inprogress) {
    return done();
  }
  const { players } = document;
  const uizaPlayer = _.find(players, (x) => x.playerType === documentPlayerTypes.uiza);
  const entityId = _.get(uizaPlayer, 'playerData.entityId');
  if (!entityId) {
    await Document.updateOne({ _id: documentId }, {
      status: documentStatuses.error,
      errorMessage: `Error on publishing to uiza, entity: ${entityId}`,
    });
  } else {
    const publishRes = await uiza.entity.get_status_publish(entityId);
    if (publishRes.status === 'success') {
      const retrieveRes = await uiza.entity.retrieve(entityId);
      const { duration } = retrieveRes;
      await Document.updateOne({ _id: documentId }, {
        status: documentStatuses.ready,
        duration,
      });
      await Lesson.updateOne({ documentId }, { duration });
      const file = await File.findById(document.fileId);
      await s3Util.deleteObject(file.s3Path);
      file.status = fileStatuses.deleted;
      console.log(`Finish: update uiza video publish status, documentId: ${documentId}, status: ready`);
      await file.save();
    } else if (publishRes.status === 'error') {
      await Document.updateOne({ _id: documentId }, {
        status: documentStatuses.error,
        errorMessage: `Error on publishing to uiza, entity: ${entityId}`,
      });
    }
  }
  console.log(`Finish: update uiza video publish status, documentId: ${documentId}`);
  return done();
});

agenda.define('scan update document publish status', { priority: 10 }, async (job, done) => {
  console.log('Start: scan update document publish status');
  const documents = await Document.find({
    status: documentStatuses.inprogress,
    type: documentTypes.video,
  });
  for (let i = 0; i < documents.length; i += 1) {
    const document = documents[i];
    await agenda.now('update uiza video publish status', { documentId: document._id });
  }
  console.log(`Found: ${documents.length}`);
  console.log('Finish: scan update document publish status');
  done();
});

agenda.define('backup database', async (job, done) => {
  console.log('Start: backup database');
  try {
    await mongoS3({
      log: () => { },
      uri: constants.mongodbUrl,
      s3: {
        accessKeyId: constants.s3.accessKeyId,
        secretAccessKey: constants.s3.secretAccessKey,
        bucket: constants.s3.bucket,
        key: `${constants.env}/backup/Rabiknow-${constants.env}-${moment().format('YYYYMMDDHH')}.zip`,
      },
    });
    console.log('Finish: backup database');
    return done();
  } catch (err) {
    console.log('Error: backup database');
    return done(err);
  }
});

agenda.define('remove unused s3 file', async (job, done) => {
  if (constants.env !== 'prod') {
    return done(new Error('Only work on production!'));
  }
  console.log('Start: remove unused s3 file');
  const files = await File.find({ status: 'removed', storage: fileStorages.s3 });
  for (const file of files) {
    await s3Util.deleteObject({ s3Path: file.s3Path });
    console.log(`Deleted: fileId: ${file._id}, s3Path: ${file.s3Path}`);
    await File.updateOne({ _id: file._id }, { status: 'deleted' });
  }
  console.log('Finish: remove unused s3 file');
  return done();
});

agenda.define('clean unprocessed document', async (job, done) => {
  console.log('Start: clean unprocessed document');
  await Document.updateMany({
    status: { $nin: [documentStatuses.error, documentStatuses.ready] },
    createdAt: { $lt: (moment().add(-1, 'day')) },
  }, { status: 'error' });
  console.log('Finish: clean unprocessed document');
  return done();
});

agenda.on('ready', () => {
  removeStaleJobs(() => {
    agenda.start();
    agenda.purge();
    agenda.every('10 days', 'clean unprocessed document');
    agenda.every('1 minute', 'scan update document publish status');
    agenda.every('1 day', 'backup database');
    agenda.every('1 day', 'remove unused s3 file');
  });
});

// restart old job when restart server
function removeStaleJobs(callback) {
  agenda._collection.updateMany({
    lockedAt: {
      $exists: true,
    },
    lastFinishedAt: {
      $exists: false,
    },
  }, {
    $unset: {
      lockedAt: undefined,
      lastModifiedBy: undefined,
      lastRunAt: undefined,
    },
    $set: {
      nextRunAt: new Date(),
    },
  }, callback);
}

export default agenda;
