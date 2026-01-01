const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/admin/login', (req, res) => {
  const { passcode } = req.body || {};

  if (!passcode || typeof passcode !== 'string') {
    return res.status(400).json({ error: 'Passcode required' });
  }

  if (passcode !== process.env.ADMIN_PASSCODE) {
    return res.status(401).json({ error: 'Invalid passcode' });
  }

  const token = jwt.sign(
    { role: 'admin' },
    process.env.JWT_SECRET,
    { subject: 'admin', expiresIn: '12h' }
  );

  return res.json({ token, expiresIn: '12h' });
});

module.exports = router;
