
import request from 'request-promise';
import _ from 'lodash';

export default class IMSUtil {
  /**
   * @returns {Promise<{
   *  instance_key: String,
   *  instance_name: String,
   *  avatarUrl: String,
   *  email: String
   * }>}
   */
  static authenticateClient = async (clientKey, clientToken) => {
    const response = await request({
      uri: 'http://ims.rabita.vn/api/v1/instance/check-instance',
      // uri: 'http://ims.rabita.vn/api/v1/instance/check-instance-auth',
      qs: {
        key: clientKey,
        token: clientToken,
        device: 'WEB',
      },
      json: true,
    });
    if (response.data.success) {
      const client = _.get(response, 'data.data');
      return client;
    }
    return null;
  }

  /**
   * @returns {Promise<{
    *  partner_key: String,
    *  partner_name: String,
    *  email: String
    * }>}
    */
  static authenticatePartner = async (partnerKey, partnerToken) => {
    if (!partnerKey || !partnerToken) return null;
    const response = await request({
      uri: 'http://ims.rabita.vn/api/v1/instance/check-partner',
      // uri: 'http://ims.rabita.vn/api/v1/instance/check-partner-auth',
      qs: {
        key: partnerKey,
        token: partnerToken,
        device: 'WEB',
      },
      json: true,
    });
    if (response.data.success) {
      const partner = _.get(response, 'data.data');
      return partner;
    }
    // return null;
    return ({
      partner_key: partnerKey,
      partner_name: partnerKey,
      email: 'support@gmail.com',
    });
  }
}
