const express = require('express');
const router = express.Router();
const axios = require('axios');
const { OpenAI } = require('openai');
const { classifyIntent } = require('../services/nlp/classifyIntent');
const  { createPrompt, updatePrompt, deletePrompt } = require('../services/nlp/gptPromptManager');
const { parseGPTResponse } = require('../services/nlp/parseResponse');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Chat history storage (in-memory for now)
let chatHistory = [];

// GET /api/chat/history
router.get('/history', (req, res) => {
  res.json(chatHistory);
});

// POST /api/chat
router.post('/', async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: 'No message provided' });
  }

  console.log(`Received message: ${userMessage}`);

  try {
    const intent = await classifyIntent(userMessage);
    console.log(`Intent classified as: ${intent}`);

    let replyMessage;
    let type = intent;
    let calendarLink;

    switch (intent) {
      case 'list': {
        // List existing events
        const listRes = await axios.get(
          'http://localhost:3000/api/calendar/list-events',
          { headers: { Authorization: req.headers.authorization } }
        );
        const events = listRes.data;
        if (events.length === 0) {
          replyMessage = 'You have no upcoming events.';
        } else {
          replyMessage = 'Here are your upcoming events:\n' +
            events.map(e => `- ${e.summary} at ${e.start.dateTime || e.start.date}`).join('\n');
        }
        break;
      }

      case 'update': {

        // grab existing list of events
        const listRes = await axios.get(
          'http://localhost:3000/api/calendar/list-events',
          { headers: { Authorization: req.headers.authorization } }
        );
        const events = listRes.data;

        // pass existing events into prompt
        const prompt = updatePrompt(userMessage, events);
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
        });
        const gptOutput = completion.choices[0].message.content;
        const { eventId, title, location, description, start, end } = JSON.parse(gptOutput);

        if (eventId == "None") {
          replyMessage = "Event not found.";
          break;
        }

        // Call API to update
        const updateRes = await axios.put(
          'http://localhost:3000/api/calendar/modify-event',
          { eventId, summary: title, location, description, start, end },
          { headers: { Authorization: req.headers.authorization } }
        );
        calendarLink = updateRes.data.htmlLink;
        replyMessage = `Event updated!`;
        break;
      }

      case 'delete': {
        // grab existing list of events

        console.log('grabbing list of events...')

        const listRes = await axios.get(
          'http://localhost:3000/api/calendar/list-events',
          { headers: { Authorization: req.headers.authorization } }
        );
        
        const events = listRes.data;


        // pass existing events into prompt

        console.log(`asking gpt...`)

        const prompt = deletePrompt(userMessage, events);
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
        });
        const gptOutput = completion.choices[0].message.content;

        console.log(`gptOutput: ${gptOutput}`)
        const { eventId } = JSON.parse(gptOutput);
        if (eventId == "None") {
          replyMessage = "Event not found.";
          break;
        }

        // Call API to delete
        await axios.delete(
          `http://localhost:3000/api/calendar/delete-event/${eventId}`,
          { headers: { Authorization: req.headers.authorization } }
        );
        replyMessage = 'Event deleted successfully.';
        break;
      }

      case 'create':
      default: {
        // Build create prompt and parse
        const prompt = createPrompt(userMessage);
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
        });
        const gptOutput = completion.choices[0].message.content;
        const parsedEvent = parseGPTResponse(gptOutput);

        // Forward event to API
        const calendarRes = await axios.post(
          'http://localhost:3000/api/calendar/add-event',
          {
            summary: parsedEvent.title,
            location: parsedEvent.location,
            description: parsedEvent.description,
            start: parsedEvent.start,
            end: parsedEvent.end,
          },
          { headers: { Authorization: req.headers.authorization } }
        );
        calendarLink = calendarRes.data.htmlLink;
        replyMessage = `Event created!`;
        break;
      }
    }

    // Store in chat history
    chatHistory.push({ id: Date.now().toString(), message: userMessage, role: 'user', timestamp: new Date() });
    chatHistory.push({ id: (Date.now() + 1).toString(), message: replyMessage, role: 'assistant', timestamp: new Date() });

    // Return response
    return res.status(200).json({ message: replyMessage, type, calendarLink });
  } catch (err) {
    console.error('Error in chat route:', err);
    return res.status(500).json({ error: 'Something went wrong', details: err.message });
  }
});

module.exports = router;
