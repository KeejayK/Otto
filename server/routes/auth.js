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

    const tokenInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
    );

    if (!tokenInfoResponse.ok) {
      console.warn('tokeninfo lookup failed:', await tokenInfoResponse.text());
    }
    const tokenInfo = tokenInfoResponse.ok
      ? await tokenInfoResponse.json()
      : {};

    const scopeString = tokenInfo.scope || '';
    const hasCalendarEventsScope = scopeString
      .split(' ')
      .includes('https://www.googleapis.com/auth/calendar.events');
    const hasCalendarScope = scopeString
      .split(' ')
      .includes('https://www.googleapis.com/auth/calendar');
    const calendarAccess = hasCalendarScope && hasCalendarEventsScope;

    const userData = {
      google: {
        accessToken,
        updatedAt: new Date(),
      },
    };

    if (profile) {
      userData.profile = {
        displayName: profile.displayName || '',
        email: profile.email || '',
        photoURL: profile.photoURL || '',
        lastLogin: new Date(),
        firstLogin: admin.firestore.FieldValue.serverTimestamp(),
      };
    }

    const userRef = admin.firestore().collection('users').doc(uid);
    await admin.firestore().runTransaction(async (tx) => {
      const userDoc = await tx.get(userRef);
      if (userDoc.exists && userDoc.data().profile && userDoc.data().profile.firstLogin) {
        delete userData.profile.firstLogin;
      }
      tx.set(userRef, userData, { merge: true });
    });

    return res.json({
      success: true,
      calendarAccess,
    });
  } catch (error) {
    console.error('Error in /auth/google:', error);
    return res.status(500).json({ error: 'Failed to store token' });
  }
});

module.exports = router; // Export the router to be used in the main app
