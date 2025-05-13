const express = require('express');
const router = express.Router();
const axios = require('axios');
const { OpenAI } = require('openai');

const { buildPrompt } = require('../services/nlp/gptPromptManager');
const { parseGPTResponse } = require('../services/nlp/parseResponse');
const { classifyIntent } = require('../services/nlp/classifyIntent');

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

  try {
    // Determine message intent
    const intent = await classifyIntent(userMessage);

    // Handle based on intent
    if (intent === 'query') {
      // TODO: Implement query handling
      return res.status(200).json({
        message: 'I can help you find that information...',
        type: 'query',
      });
    }

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
    const calendarResponse = await axios.post(
      'http://localhost:3000/api/calendar/add-event',
      {
        summary: parsedEvent.title,
        location: parsedEvent.location,
        description: parsedEvent.description || '',
        start: parsedEvent.start,
        end: parsedEvent.end,
      },
    );

    // Step 5: Store in chat history
    chatHistory.push({
      id: Date.now().toString(),
      message: userMessage,
      role: 'user',
      timestamp: new Date(),
    });

    chatHistory.push({
      id: (Date.now() + 1).toString(),
      message: `Event created! View it here: ${calendarResponse.data}`,
      role: 'assistant',
      timestamp: new Date(),
    });

    return res.status(200).json({
      message: 'Event created',
      calendarLink: calendarResponse.data,
      type: 'event',
    });
  } catch (err) {
    console.error('Error in chat route:', err.message);
    return res.status(500).json({
      error: 'Something went wrong',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

module.exports = router;
