const express = require('express');
const { google } = require('googleapis');
const admin = require('../firebase');
const verifyFirebaseToken = require('../middleware/auth');

const router = express.Router();

// Helper function to initialize Google Calendar API
async function initializeGoogleCalendar(uid) {
  // Retrieve stored Google credentials
  console.log('Retrieving google creds');
  const userDoc = await admin.firestore().collection('users').doc(uid).get();
  const googleCreds = userDoc.data().google;
  if (!googleCreds?.accessToken) {
    throw new Error('Missing Google access token');
  }

  console.log('Initializing Oauth2 Client');
  // Initialize OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  console.log('Setting credentials');
  const tokens = { access_token: googleCreds.accessToken };
  if (googleCreds.refreshToken) {
    tokens.refresh_token = googleCreds.refreshToken;
  }
  oauth2Client.setCredentials(tokens);

  console.log('Initializing calendar');
  // Initialize Calendar API with auth
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

// POST /api/calendar/add-event
router.post('/add-event', verifyFirebaseToken, async (req, res) => {
  console.log(`POST /api/calendar/add-event`);
  const uid = req.user.uid;
  const { summary, location, description, start, end } = req.body;

  try {
    const calendar = await initializeGoogleCalendar(uid);

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
    const calendar = await initializeGoogleCalendar(uid);

    try {
      await calendar.events.get({
        calendarId: 'primary',
        eventId: eventId,
      });
    } catch (error) {
      if (error.code === 404) {
        return res.status(404).json({ error: 'Event not found' });
      }
      throw error;
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
    const calendar = await initializeGoogleCalendar(uid);

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
      const calendar = await initializeGoogleCalendar(uid);

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
      return res.json({ success: true, eventId });
    } catch (error) {
      console.error('Error deleting event:', error);
      return res.status(500).json({ error: 'Failed to delete calendar event' });
    }
  },
);

// GET /api/calendar/list-events
router.get('/list-events', verifyFirebaseToken, async (req, res) => {
  console.log(`GET /api/calendar/list-events`);
  const uid = req.user.uid;

  try {
    const calendar = await initializeGoogleCalendar(uid);

    const now = (new Date()).toISOString();

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 10,
    });

    return res.json(response.data.items);
  } catch (error) {
    console.error('Error listing events:', error);
    return res.status(500).json({ error: 'Failed to list calendar events' });
  }
});

module.exports = router;
