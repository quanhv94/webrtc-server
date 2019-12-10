import dotenv from 'dotenv';

dotenv.config();

const constants = {
  appName: 'RabiKnow',
  env: process.env.ENV,
  jwtKey: `rabiknow-${process.env.ENV}`,
  localStorageFolder: 'upload',
  mongodbUrl: `mongodb://localhost:27017/rabiknow-${process.env.ENV}`,
  s3: {
    accessKeyId: 'AKIARILCIGEJMUDYZL6R',
    secretAccessKey: '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',
    region: 'ap-southeast-1',
    bucket: 'rabita-rabiknow',
  },
  uiza: {
    uizaApiDomain: 'rabiknow-api.uiza.co',
    uizaApiAppId: '2557683331d54974a04c42784e074056',
    uizaApiToken: 'uap-2557683331d54974a04c42784e074056-d48533a5',
  },
  googleDrive: {
    developerKey: 'AIzaSyAUp6Kl6e3erds8AicU8yJoHg953mgJTKA',
    appId: '799017060213',
    clientId: '799017060213-1m83kb7gn98p6iqt5u9gnf2lfs8nl4ps.apps.googleusercontent.com',
  },
};

export default constants;
