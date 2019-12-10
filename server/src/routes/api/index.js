import express from 'express';
import apiV1Router from './v1/index';
import ResonseUtil from '../../util/response';

const router = express.Router({ mergeParams: true });

// add error and success response function to res object
router.use((req, res, next) => {
  res.success = ResonseUtil.success;
  res.error = ResonseUtil.error;
  next();
});

// api v1 routing
router.use('/v1', apiV1Router);

// global error handing
router.use((error, req, res, next) => {
  if (!error) next();
  return res.error({ message: error.message, status: error.statusCode });
});

// global api 404 not found handling
router.use('*', (req, res) => res.error({ res, status: 404, message: 'Not Found' }));

export default router;
