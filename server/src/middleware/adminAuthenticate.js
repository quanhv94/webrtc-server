// eslint-disable-next-line no-unused-vars
import express from 'express';
import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import constants from '../config/constants';

/**
 * @type {express.RequestHandler}
 */
const adminAuthenticate = async (req, res, next) => {
  try {
    const adminToken = req.header('admin-token') || req.query['admin-token'] || req.body['admin-token'];
    const payload = jwt.verify(adminToken, constants.jwtKey);
    const { role } = payload;
    if (role !== 'admin') {
      throw createHttpError(401, 'Unauthorized!');
    } else {
      next();
    }
  } catch {
    throw createHttpError(401, 'Unauthorized!');
  }
};

export default adminAuthenticate;
