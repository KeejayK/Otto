const express = require('express');
const { google } = require('googleapis');

const admin = require('firebase-admin');

const router = express.Router();

// Create a calendar instance
const calendar = google.calendar({ version: 'v3' });

// Function to get the access token from Firestore
async function getAccessToken(uid) {
  const userDoc = await admin.firestore().collection('users').doc(uid).get();
  if (userDoc.exists) {
    return userDoc.data().google.accessToken;
  } else {
    throw new Error('User not found');
  }
}

// Function to set up OAuth2 client with access token
async function setupOAuth2Client(uid) {
  const accessToken = await getAccessToken(uid);
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });
  return oauth2Client;
}

// Route to create a Google Calendar event
router.post('/add-event', async (req, res) => {
=======
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

// Example usage in a route
router.get('/some-protected-route', async (req, res) => {
  try {
    const uid = req.user.uid; // Assume req.user is set by authentication middleware
    const oauth2Client = await setupOAuth2Client(uid);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    // Use the calendar instance for further API calls
    res.status(200).json({ message: 'OAuth2 client set up successfully' });
  } catch (error) {
    console.error('Error setting up OAuth2 client:', error);
    res.status(500).json({ error: 'Failed to set up OAuth2 client' });
  }
});

module.exports = router;
