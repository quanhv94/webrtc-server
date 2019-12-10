import axios from 'axios';
import constants from '../config/constants';

const Axios = axios.create({
  timeout: 3 * 60 * 1000,
  baseURL: constants.apiHost,
});

export const sendGet = (url, params) => Axios.get(url, { params });
export const sendPost = (url, params) => Axios.post(url, params);
export const sendPut = (url, params) => Axios.put(url, params);
export const sendPatch = (url, params) => Axios.patch(url, params);
export const sendDelete = (url, params) => Axios.delete(url, { params });

class API {
  static getStringeeToken = ({ userId }) => sendPost('/api/v1/stringee-token', { userId });
}

export default API;
