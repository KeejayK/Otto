const express = require('express');
const bodyParser = require('body-parser');
const calendarRoutes = require('./routes/calendar');
const syllabusRoutes = require('./routes/syllabus');

const app = express();
app.use(bodyParser.json());

// Use the calendar routes
app.use('/api/calendar', calendarRoutes);

//For syllabus parser

app.use('/api/syllabus', syllabusRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
