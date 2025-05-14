const express = require('express');
const bodyParser = require('body-parser');
const calendarRoutes = require('./routes/calendar');
const syllabusRoutes = require('./routes/syllabus');
const authRoutes = require('./routes/auth');
const cors = require('cors');

function createApp({ includeAuth = true, includeCalendar = true, includeSyllabus = true } = {}) {
  const app = express();

  app.use(
    cors({
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  app.use(bodyParser.json());

  if (includeCalendar) app.use('/api/calendar', calendarRoutes);
  if (includeSyllabus) app.use('/api/syllabus', syllabusRoutes);
  if (includeAuth) app.use('/api/auth', authRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}

module.exports = createApp;
