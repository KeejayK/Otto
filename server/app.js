const express = require('express');
const bodyParser = require('body-parser');
const calendarRoutes = require('./routes/calendar');
const syllabusRoutes = require('./routes/syllabus');
const authRoutes = require('./routes/auth');
const cors = require('cors');

const app = express();


app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));


app.use(bodyParser.json());

app.use('/api/calendar', calendarRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/auth', authRoutes);

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
