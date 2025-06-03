const express = require('express');
const admin = require('../firebase');
const verifyFirebaseToken = require('../middleware/auth');

const router = express.Router();

// Route to handle Google authentication token storage
router.post('/google', verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  const { accessToken } = req.body;

  if (!accessToken) {
    // If access token is not provided, return an error
    return res.status(400).json({ error: 'Missing Google access token' });
  }

  try {
    // Store the Google access token in Firestore under the user's document
    await admin
      .firestore()
      .collection('users')
      .doc(uid)
      .set(
        {
          google: {
            accessToken,
            updatedAt: new Date(), // Store the current date and time
          },
        },
        { merge: true }, // Merge with existing data
      );

    res.json({ success: true }); // Respond with success
  } catch (error) {
    // Handle any errors that occur during the Firestore operation
    console.error('Error saving token:', error);
    res.status(500).json({ error: 'Failed to store token' });
  }
});

module.exports = router; // Export the router to be used in the main app
