// eslint-disable-next-line no-unused-vars
import express from 'express';
import NodeCache from 'node-cache';
import createHttpError from 'http-errors';
import Client from '../models/client';
import IMSUtil from '../util/imsUtil';

const myCache = new NodeCache();

/**
 *
 * @param {String} key Client name
 * @param {String} token Client token
 */
const getClient = async (key, token) => {
  const cachedClientId = myCache.get(`${key}-${token}`);
  if (cachedClientId) {
    const client = await Client.findById(cachedClientId);
    if (client) {
      return client;
    }
  }
  const clientData = await IMSUtil.authenticateClient(key, token);
  if (clientData) {
    const {
      avatarUrl,
      email,
      instance_name: instanceName,
    } = clientData;
    const client = await Client.findOneAndUpdate(
      { key },
      { key, avatarUrl, email, name: instanceName },
      { upsert: true, new: true },
    );
    myCache.set(`${key}-${token}`, client._id, 10 * 3600);
    return client;
  }

  return null;
};

/**
 * @type {express.RequestHandler}
 */
const clientAuthenticate = async (req, res, next) => {
  try {
    let clientKey = req.header('client-key') || req.query['client-key'] || req.body['client-key'];
    const clientToken = req.header('client-token') || req.query['client-token'] || req.body['client-key'];
    if (!clientKey || !clientToken) throw createHttpError(403, 'Access denied!');

    clientKey = clientKey.toUpperCase();
    const client = await getClient(clientKey, clientToken);
    if (!client) throw createHttpError(403, 'Access denied!');
    res.locals.client = client;
    return next();
  } catch (error) {
    return next(error);
  }
};

export default clientAuthenticate;
