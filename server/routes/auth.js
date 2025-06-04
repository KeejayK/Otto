const express = require('express');
const admin = require('../firebase');
const verifyFirebaseToken = require('../middleware/auth');

const router = express.Router();

// Route to handle Google authentication token storage
router.post('/google', verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  const { accessToken, profile } = req.body;

  if (!accessToken) {
    // If access token is not provided, return an error
    return res.status(400).json({ error: 'Missing Google access token' });
  }

  try {
    // Create a data object with all the information to store
    const userData = {
      google: {
        accessToken,
        updatedAt: new Date(),
      },
    };

    // Add profile information if available
    if (profile) {
      userData.profile = {
        displayName: profile.displayName || '',
        email: profile.email || '',
        photoURL: profile.photoURL || '',
        lastLogin: new Date(),
        firstLogin: admin.firestore.FieldValue.serverTimestamp(),
      };
    }

    // Use a transaction to properly handle the firstLogin field
    const userRef = admin.firestore().collection('users').doc(uid);

    await admin.firestore().runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);

      // If the user doc already exists and has a profile with firstLogin, don't overwrite it
      if (userDoc.exists && userDoc.data().profile && userDoc.data().profile.firstLogin) {
        delete userData.profile.firstLogin;
      }

      transaction.set(userRef, userData, { merge: true });
    });

    res.json({ success: true }); // Respond with success
  } catch (error) {
    // Handle any errors that occur during the Firestore operation
    console.error('Error saving token:', error);
    res.status(500).json({ error: 'Failed to store token' });
  }
});

module.exports = router; // Export the router to be used in the main app
