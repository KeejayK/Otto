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
  const { summary, location, description, start, end } = req.body;

  const event = {
    summary,
    location,
    description,
    start: { dateTime: start, timeZone: 'America/Los_Angeles' },
    end: { dateTime: end, timeZone: 'America/Los_Angeles' },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });
    res.status(200).send(`Event created: ${response.data.htmlLink}`);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).send('Error creating event');
  }
});

// Route to delete a Google Calendar event
router.delete('/delete-event/:eventId', async (req, res) => {
  const { eventId } = req.params;

  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
    res.status(200).send(`Event with ID ${eventId} deleted successfully.`);
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).send('Error deleting event');
  }
});

// Route to get all Google Calendar events for a certain month
router.get('/events/:year/:month', async (req, res) => {
  const { year, month } = req.params;
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate,
      timeMax: endDate,
      singleEvents: true,
      orderBy: 'startTime',
    });
    res.status(200).json(response.data.items);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).send('Error fetching events');
  }
});

// Route to modify a Google Calendar event
router.put('/modify-event/:eventId', async (req, res) => {
  const { eventId } = req.params;
  const { summary, location, description, start, end } = req.body;

  const event = {
    summary,
    location,
    description,
    start: { dateTime: start, timeZone: 'America/Los_Angeles' },
    end: { dateTime: end, timeZone: 'America/Los_Angeles' },
  };

  try {
    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: event,
    });
    res.status(200).send(`Event updated: ${response.data.htmlLink}`);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).send('Error updating event');
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
