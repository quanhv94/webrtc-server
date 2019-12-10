// eslint-disable-next-line no-unused-vars
import express from 'express';
import createHttpError from 'http-errors';
import AccessTokenUtil from '../util/accessToken';

/**
 * @type {express.RequestHandler}
 */
const guestAuthenticate = async (req, res, next) => {
  try {
    const accessToken = req.header('access-token') || req.query['access-token'] || req.body['access-token'];
    if (!accessToken) throw createHttpError(403, 'Access denied!');
    if (accessToken.toUpperCase() !== AccessTokenUtil.generateAccessToken()) {
      throw createHttpError(403, 'Access denied!');
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

export default guestAuthenticate;
