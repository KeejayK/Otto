const express = require('express');
const bodyParser = require('body-parser');
const calendarRoutes = require('./routes/calendar');

const app = express();
app.use(bodyParser.json());

// Use the calendar routes
app.use('/api/calendar', calendarRoutes);

module.exports = app;
