const express = require('express');
const { google } = require('googleapis');
const admin = require('../firebase');
const verifyFirebaseToken = require('../middleware/auth');

const router = express.Router();

// POST /api/calendar/add-event
router.post('/add-event', verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  const { summary, location, description, start, end } = req.body;

  try {
    // Retrieve stored Google credentials
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const googleCreds = userDoc.data().google;
    if (!googleCreds?.accessToken) {
      return res.status(400).json({ error: 'Missing Google access token' });
    }

    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    // Set credentials (include refresh token if stored)
    const creds = { access_token: googleCreds.accessToken };
    if (googleCreds.refreshToken)
      creds.refresh_token = googleCreds.refreshToken;
    oauth2Client.setCredentials(creds);

    // Initialize Calendar API with auth
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Build the event resource
    const event = {
      summary,
      location,
      description,
      start: { dateTime: start },
      end: { dateTime: end },
    };

    // Insert the event
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    // Return the event link
    return res.json({ htmlLink: response.data.htmlLink });
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

module.exports = router;
