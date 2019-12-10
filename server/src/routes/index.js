import express from 'express';
import path from 'path';
import apiRouter from './api/index';

const router = express.Router({ mergeParams: true });

router.use('/api', apiRouter);
router.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../client/build/index.html'));
});

export default router;
