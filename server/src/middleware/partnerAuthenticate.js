// eslint-disable-next-line no-unused-vars
import express from 'express';
import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import constants from '../config/constants';
import Partner from '../models/partner';

/**
 * @type {express.RequestHandler}
 */
const partnerAuthenticate = async (req, res, next) => {
  try {
    const partnerToken = req.header('partner-token') || req.query['partner-token'] || req.body['partner-token'];
    const payload = jwt.verify(partnerToken, constants.jwtKey);
    const { partnerId } = payload;
    const partner = await Partner.findById(partnerId);
    if (!partner) throw createHttpError(403, 'Access denied!');
    res.locals.partner = partner;
    next();
  } catch {
    throw createHttpError(403, 'Access denied!');
  }
};

export default partnerAuthenticate;
