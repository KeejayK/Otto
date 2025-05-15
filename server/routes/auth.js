const express = require('express');
const admin = require('../firebase');
const verifyFirebaseToken = require('../middleware/auth');

const router = express.Router();

router.post('/google', verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  const { accessToken, refreshToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ error: 'Missing Google access token' });
  }

  const googleData = {
    accessToken,
    updatedAt: new Date()
  }

  if (refreshToken) {
    googleData.refreshToken = refreshToken
  }

  try {
    await admin
      .firestore()
      .collection('users')
      .doc(uid)
      .set(
        { google: googleData },
        { merge: true },
      );

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving token:', error);
    res.status(500).json({ error: 'Failed to store token' });
  }
});

module.exports = router;
