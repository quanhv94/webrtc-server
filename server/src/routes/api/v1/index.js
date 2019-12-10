import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router({ mergeParams: true });


router.use('/stringee-token', (req, res) => {
  const apiKeySid = 'SKDvUH7RmGhlASlpSShE9Ll4BA5XBmLr3f';
  const apiKeySecret = 'VllYdzM1bnFtSGtYYnVMY2kzS0t3bGp1SDhmMFBhRQ==';
  const { userId } = req.body;
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;

  const header = { cty: 'stringee-api;v=1' };
  const payload = {
    jti: `${apiKeySid}-${now}`,
    iss: apiKeySid,
    exp,
    userId,
  };

  const token = jwt.sign(payload, apiKeySecret, { algorithm: 'HS256', header });
  res.success({ data: token });
});

export default router;
