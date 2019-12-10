import moment from 'moment';
import md5 from 'md5';
import constants from '../config/constants';

export default class AccessTokenUtil {
  static generateAccessToken = () => md5(`${constants.appName}${moment().format('YYYYMMDDHH')}`).toUpperCase();
}
