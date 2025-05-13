const express = require('express');
const { google } = require('googleapis');

const router = express.Router();

// Set up OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/oauth2callback', // Redirect URL
);

// Set the credentials
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

// Create a calendar instance
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

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

module.exports = router;
