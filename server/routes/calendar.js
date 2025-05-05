const express = require('express');
const { google } = require('googleapis');

const router = express.Router();

// Set up OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/oauth2callback' // Redirect URL
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

module.exports = router;
