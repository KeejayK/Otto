const express = require('express');
const { google } = require('googleapis');
const admin = require('../firebase');
const verifyFirebaseToken = require('../middleware/auth');

const router = express.Router();

// POST /api/calendar/add-event
router.post('/add-event', verifyFirebaseToken, async (req, res) => {
  console.log(`POST /api/calendar/add-event`);
  const uid = req.user.uid;
  const { summary, location, description, start, end } = req.body;

  try {
    // Retrieve stored Google credentials

    console.log('Retrieving google creds');
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const googleCreds = userDoc.data().google;
    if (!googleCreds?.accessToken) {
      return res.status(400).json({ error: 'Missing Google access token' });
    }

    console.log('Initializing Oauth2 Client');
    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    // Set credentials (include refresh token if stored)
    console.log('Setting credentials');
    const tokens = { access_token: googleCreds.accessToken };
    if (googleCreds.refreshToken) {
      tokens.refresh_token = googleCreds.refreshToken;
    }
    oauth2Client.setCredentials(tokens);

    // Optional: listen for token refresh and update Firestore
    oauth2Client.on('tokens', async (newTokens) => {
      if (newTokens.refresh_token) {
        // Save new refresh token
        await admin
          .firestore()
          .collection('users')
          .doc(uid)
          .set(
            {
              google: { refreshToken: newTokens.refresh_token },
            },
            { merge: true },
          );
      }
    });

    console.log('Initializing calendar');

    // Initialize Calendar API with auth
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Build the event resource

    console.log(`startDate: ${start}`);
    console.log(`endDate: ${end}`);

    const startDate = new Date(start);
    const endDate = new Date(end);

    const isoStart = startDate.toISOString();
    const isoEnd = endDate.toISOString();

    console.log(`${isoStart}, ${isoEnd}`);

    const event = {
      summary,
      location,
      description,
      start: { dateTime: isoStart, timeZone: 'America/Los_Angeles' },
      end: { dateTime: isoEnd, timeZone: 'America/Los_Angeles' },
    };

    console.log('Insert event');

    // Insert the event
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    console.log('received response');

    // Return the event link
    return res.json({ htmlLink: response.data.htmlLink });
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

// PUT /api/calendar/modify-event
router.put('/modify-event', verifyFirebaseToken, async (req, res) => {
  console.log(`PUT /api/calendar/modify-event`);
  const uid = req.user.uid;
  const { eventId, summary, location, description, start, end } = req.body;

  try {
    // Retrieve stored Google credentials
    console.log('Retrieving google creds');
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const googleCreds = userDoc.data().google;
    if (!googleCreds?.accessToken) {
      return res.status(400).json({ error: 'Missing Google access token' });
    }

    console.log('Initializing Oauth2 Client');
    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    // Set credentials (include refresh token if stored)
    console.log('Setting credentials');
    const tokens = { access_token: googleCreds.accessToken };
    if (googleCreds.refreshToken) {
      tokens.refresh_token = googleCreds.refreshToken;
    }
    oauth2Client.setCredentials(tokens);

    console.log('Initializing calendar');

    // Initialize Calendar API with auth
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Retrieve the event to check if it exists
    try {
      await calendar.events.get({
        calendarId: 'primary',
        eventId: eventId,
      });
    } catch (error) {
      if (error.code === 404) {
        return res.status(404).json({ error: 'Event not found' });
      }
      throw error; // Re-throw other errors
    }

    console.log('Updating event');

    // Build the event resource
    const startDate = new Date(start);
    const endDate = new Date(end);

    const isoStart = startDate.toISOString();
    const isoEnd = endDate.toISOString();

    console.log(`${isoStart}, ${isoEnd}`);

    const event = {
      summary,
      location,
      description,
      start: { dateTime: isoStart, timeZone: 'America/Los_Angeles' },
      end: { dateTime: isoEnd, timeZone: 'America/Los_Angeles' },
    };

    // Update the event
    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: event,
    });

    console.log('received response');

    // Return the event link
    return res.json({ htmlLink: response.data.htmlLink });
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({ error: 'Failed to update calendar event' });
  }
});

// GET /api/calendar/get-event/:eventId
router.get('/get-event/:eventId', verifyFirebaseToken, async (req, res) => {
  console.log(`GET /api/calendar/get-event/${req.params.eventId}`);
  const uid = req.user.uid;
  const { eventId } = req.params;

  try {
    // Retrieve stored Google credentials
    console.log('Retrieving google creds');
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const googleCreds = userDoc.data().google;
    if (!googleCreds?.accessToken) {
      return res.status(400).json({ error: 'Missing Google access token' });
    }

    console.log('Initializing Oauth2 Client');
    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    // Set credentials (include refresh token if stored)
    console.log('Setting credentials');
    const tokens = { access_token: googleCreds.accessToken };
    if (googleCreds.refreshToken) {
      tokens.refresh_token = googleCreds.refreshToken;
    }
    oauth2Client.setCredentials(tokens);

    console.log('Initializing calendar');

    // Initialize Calendar API with auth
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Retrieve the event
    const response = await calendar.events.get({
      calendarId: 'primary',
      eventId: eventId,
    });

    console.log('Event retrieved');

    // Return the event data
    return res.json(response.data);
  } catch (error) {
    console.error('Error retrieving event:', error);
    return res.status(500).json({ error: 'Failed to retrieve calendar event' });
  }
});

// DELETE /api/calendar/delete-event/:eventId
router.delete(
  '/delete-event/:eventId',
  verifyFirebaseToken,
  async (req, res) => {
    console.log(`DELETE /api/calendar/delete-event/${req.params.eventId}`);
    const uid = req.user.uid;
    const { eventId } = req.params;

    try {
      // Retrieve stored Google credentials
      console.log('Retrieving google creds');
      const userDoc = await admin
        .firestore()
        .collection('users')
        .doc(uid)
        .get();
      const googleCreds = userDoc.data().google;
      if (!googleCreds?.accessToken) {
        return res.status(400).json({ error: 'Missing Google access token' });
      }

      console.log('Initializing Oauth2 Client');
      // Initialize OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
      );

      // Set credentials (include refresh token if stored)
      console.log('Setting credentials');
      const tokens = { access_token: googleCreds.accessToken };
      if (googleCreds.refreshToken) {
        tokens.refresh_token = googleCreds.refreshToken;
      }
      oauth2Client.setCredentials(tokens);

      console.log('Initializing calendar');

      // Initialize Calendar API with auth
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // Retrieve the event to check if it exists
      try {
        await calendar.events.get({
          calendarId: 'primary',
          eventId: eventId,
        });
      } catch (error) {
        if (error.code === 404) {
          return res.status(404).json({ error: 'Event not found' });
        }
        throw error; // Re-throw other errors
      }

      // Delete the event
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });

      console.log('Event deleted');

      // Return success response
      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting event:', error);
      return res.status(500).json({ error: 'Failed to delete calendar event' });
    }
  },
);

module.exports = router;
