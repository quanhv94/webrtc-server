import AWS from 'aws-sdk';
import fs from 'fs';
import s3UpLoadStream from 's3-upload-stream';
import constants from '../config/constants';

const s3 = new AWS.S3({
  accessKeyId: constants.s3.accessKeyId,
  secretAccessKey: constants.s3.secretAccessKey,
});
const s3Stream = s3UpLoadStream(s3);

const putObject = async (localPath, s3Path) => {
  const Key = s3Path;
  const Body = await fs.promises.readFile(localPath);
  await s3.putObject({
    Bucket: constants.s3.bucket,
    Key,
    Body,
    ACL: 'public-read',
  }).promise();
  fs.unlink(localPath, () => null);
};

const putObjectStream = async (localPath, s3Path) => {
  const Key = s3Path;
  const fileSize = fs.statSync(localPath).size;
  if (fileSize < 100000000) { // size < 100MB
    return putObject(localPath, s3Path);
  }
  return new Promise((resolve, reject) => {
    const read = fs.createReadStream(localPath);
    const upload = s3Stream.upload({
      Bucket: constants.s3.bucket,
      Key,
      ACL: 'public-read',
      ContentType: 'binary/octet-stream',
    });
    upload.on('error', reject);
    upload.on('part', ({ uploadedSize }) => {
      console.log(`Uploaded size: ${((uploadedSize * 100) / fileSize).toFixed(2)}%`);
    });
    upload.on('uploaded', async () => {
      fs.unlink(localPath, () => null);
      resolve(s3Path);
    });
    read.pipe(upload);
  });
};

const deleteObject = async (s3Path) => s3.deleteObject({
  Bucket: constants.s3.bucket,
  Key: s3Path,
}).promise();

const S3Util = {
  putObject,
  putObjectStream,
  deleteObject,
};
export default S3Util;
