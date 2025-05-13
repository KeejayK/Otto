const express = require('express');
const admin = require('../firebase');
const verifyFirebaseToken = require('../middleware/auth');

const router = express.Router();

router.post('/google', verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ error: 'Missing Google access token' });
  }

  try {
    await admin
      .firestore()
      .collection('users')
      .doc(uid)
      .set(
        {
          google: {
            accessToken,
            updatedAt: new Date(),
          },
        },
        { merge: true },
      );

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving token:', error);
    res.status(500).json({ error: 'Failed to store token' });
  }
});

module.exports = router;
