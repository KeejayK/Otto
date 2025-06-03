const express = require('express');
const { google } = require('googleapis');
const admin = require('../firebase');
const verifyFirebaseToken = require('../middleware/auth');

const router = express.Router();

// Helper function to initialize Google Calendar API
async function initializeGoogleCalendar(uid) {
  // Retrieve stored Google credentials
  const userDoc = await admin.firestore().collection('users').doc(uid).get();
  
  if (!userDoc.exists) {
    throw new Error('User document not found');
  }
  
  const userData = userDoc.data();
  if (!userData || !userData.google) {
    throw new Error('Google credentials not found for user');
  }
  
  const googleCreds = userData.google;
  if (!googleCreds?.accessToken) {
    throw new Error('Missing Google access token');
  }

  // Initialize OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  const tokens = { access_token: googleCreds.accessToken };
  if (googleCreds.refreshToken) {
    tokens.refresh_token = googleCreds.refreshToken;
  }
  oauth2Client.setCredentials(tokens);

  // Initialize Calendar API with auth
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

// POST /api/calendar/add-event
router.post('/add-event', verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  const { summary, location, description, start, end, recurrence } = req.body;

  // Validate required fields
  if (!summary || !start || !end) {
    return res.status(400).json({ error: 'Missing required fields: summary, start, or end' });
  }

  try {
    const calendar = await initializeGoogleCalendar(uid);

    // Parse and validate dates
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format for start or end' });
    }

    const isoStart = startDate.toISOString();
    const isoEnd = endDate.toISOString();

    const event = {
      summary,
      location: location || '',
      description: description || '',
      start: { dateTime: isoStart, timeZone: 'America/Los_Angeles' },
      end: { dateTime: isoEnd, timeZone: 'America/Los_Angeles' },
    };
    
    // Add recurrence rule if provided
    if (recurrence && Array.isArray(recurrence) && recurrence.length > 0) {
      event.recurrence = recurrence;
    }

    // Insert the event
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    // Return the event link
    return res.json({ htmlLink: response.data.htmlLink });
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ error: 'Failed to create calendar event', details: error.message });
  }
});

// GET /api/calendar/list-events
router.get('/list-events', verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  
  try {
    const calendar = await initializeGoogleCalendar(uid);

    // Get now as ISO string
    const now = new Date().toISOString();

    // Get events sorted by start time
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now,
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    return res.json(events);
  } catch (error) {
    console.error('Error listing events:', error);
    return res.status(500).json({ error: 'Failed to list calendar events' });
  }
});

// PUT /api/calendar/modify-event
router.put('/modify-event', verifyFirebaseToken, async (req, res) => {
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

    // Build the event resource
    const startDate = new Date(start);
    const endDate = new Date(end);

    const isoStart = startDate.toISOString();
    const isoEnd = endDate.toISOString();
    
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

    // Return the event link
    return res.json({ htmlLink: response.data.htmlLink });
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({ error: 'Failed to update calendar event' });
  }
});

// GET /api/calendar/get-event/:eventId
router.get('/get-event/:eventId', verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  const { eventId } = req.params;

  try {
    const calendar = await initializeGoogleCalendar(uid);

    // Retrieve the event
    const response = await calendar.events.get({
      calendarId: 'primary',
      eventId: eventId,
    });

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

      // Return 204 No Content for successful deletion
      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting event:', error);
      return res.status(500).json({ error: 'Failed to delete calendar event' });
    }
  },
);

module.exports = router;
