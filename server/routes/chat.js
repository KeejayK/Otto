const express = require('express');
const router = express.Router();
const axios = require('axios');
const { OpenAI } = require('openai');

const { buildPrompt } = require('../services/nlp/gptPromptManager');
const { parseGPTResponse } = require('../services/nlp/parseResponse');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /chat
router.post('/', async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: 'No message provided' });
  }

  try {
    // Step 1: Build GPT prompt
    const prompt = buildPrompt(userMessage);

    // Step 2: Send prompt to GPT
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    const gptOutput = completion.choices[0].message.content;

    // Step 3: Parse GPT's output into event object
    const parsedEvent = parseGPTResponse(gptOutput);

    // Step 4: Forward event to calendar creation route
    const calendarResponse = await axios.post('http://localhost:3000/calendar/add-event', {
      summary: parsedEvent.title,
      location: parsedEvent.location,
      description: parsedEvent.description || '',
      start: parsedEvent.start,
      end: parsedEvent.end,
    });

    return res.status(200).json({
      message: 'Event created',
      calendarLink: calendarResponse.data,
    });

  } catch (err) {
    console.error('Error in chat route:', err.message);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
