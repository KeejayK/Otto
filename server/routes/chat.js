const express = require('express');
const router = express.Router();
const axios = require('axios');
const { OpenAI } = require('openai');
const { classifyIntent } = require('../services/nlp/classifyIntent');
const { createPrompt, updatePrompt, deletePrompt } = require('../services/nlp/gptPromptManager');
const { parseGPTResponse } = require('../services/nlp/parseResponse');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const verifyFirebaseToken = require('../middleware/auth');

// In-memory session state for multi-turn event creation and modification
const sessionState = {};

// Chat history storage (in-memory for now)
let chatHistory = [];

// GET /api/chat/history
router.get('/history', (req, res) => {
  res.json(chatHistory);
});

// POST /api/chat
router.post('/', verifyFirebaseToken, async (req, res) => {
  const userMessage = req.body.message;
  const authHeader = req.headers.authorization;
  const sessionId = req.user?.uid || req.headers['x-user-id'] || 'default';

  if (!userMessage) {
    return res.status(400).json({ error: 'No message provided' });
  }

  console.log(`Received message: ${userMessage}`);

  try {
    // Multi-turn flows for create, update, delete
    if (sessionState[sessionId]?.pendingEvent) {
      const pending = sessionState[sessionId].pendingEvent;

      // --- Confirmation for update/delete/create ---
      if (pending.awaitingConfirmation) {
        if (/^(yes|y|confirm)$/i.test(userMessage.trim())) {
          if (pending.action === 'update') {
            // Update event
            try {
              const updateRes = await axios.put(
                'http://localhost:3000/api/calendar/modify-event',
                {
                  eventId: pending.eventId,
                  summary: pending.title,
                  location: pending.location,
                  description: pending.description,
                  start: pending.start,
                  end: pending.end,
                },
                { headers: { Authorization: authHeader } }
              );
              delete sessionState[sessionId].pendingEvent;
              const replyMessage = 'Event updated!';
              chatHistory.push({ id: Date.now().toString(), message: userMessage, role: 'user', timestamp: new Date() });
              chatHistory.push({ id: (Date.now() + 1).toString(), message: replyMessage, role: 'assistant', timestamp: new Date() });
              return res.status(200).json({ message: replyMessage, type: 'update', calendarLink: updateRes.data.htmlLink });
            } catch (err) {
              delete sessionState[sessionId].pendingEvent;
              const replyMessage = 'Failed to update event. Please try again.';
              chatHistory.push({ id: Date.now().toString(), message: userMessage, role: 'user', timestamp: new Date() });
              chatHistory.push({ id: (Date.now() + 1).toString(), message: replyMessage, role: 'assistant', timestamp: new Date() });
              return res.status(200).json({ message: replyMessage });
            }
          } else if (pending.action === 'delete') {
            // Delete event
            try {
              await axios.delete(
                `http://localhost:3000/api/calendar/delete-event/${pending.eventId}`,
                { headers: { Authorization: authHeader } }
              );
              delete sessionState[sessionId].pendingEvent;
              const replyMessage = 'Event deleted successfully.';
              chatHistory.push({ id: Date.now().toString(), message: userMessage, role: 'user', timestamp: new Date() });
              chatHistory.push({ id: (Date.now() + 1).toString(), message: replyMessage, role: 'assistant', timestamp: new Date() });
              return res.status(200).json({ message: replyMessage, type: 'delete' });
            } catch (err) {
              delete sessionState[sessionId].pendingEvent;
              const replyMessage = 'Failed to delete event. Please try again.';
              chatHistory.push({ id: Date.now().toString(), message: userMessage, role: 'user', timestamp: new Date() });
              chatHistory.push({ id: (Date.now() + 1).toString(), message: replyMessage, role: 'assistant', timestamp: new Date() });
              return res.status(200).json({ message: replyMessage });
            }
          } else {
            // Create event
            try {
              const calendarRes = await axios.post(
                'http://localhost:3000/api/calendar/add-event',
                {
                  summary: pending.title,
                  location: pending.location,
                  description: pending.description,
                  start: pending.start,
                  end: pending.end,
                },
                { headers: { Authorization: authHeader } }
              );
              delete sessionState[sessionId].pendingEvent;
              const replyMessage = 'Event added to your calendar!';
              chatHistory.push({ id: Date.now().toString(), message: userMessage, role: 'user', timestamp: new Date() });
              chatHistory.push({ id: (Date.now() + 1).toString(), message: replyMessage, role: 'assistant', timestamp: new Date() });
              return res.status(200).json({ message: replyMessage, type: 'create', calendarLink: calendarRes.data.htmlLink });
            } catch (err) {
              delete sessionState[sessionId].pendingEvent;
              const replyMessage = 'Failed to add event. Please try again.';
              chatHistory.push({ id: Date.now().toString(), message: userMessage, role: 'user', timestamp: new Date() });
              chatHistory.push({ id: (Date.now() + 1).toString(), message: replyMessage, role: 'assistant', timestamp: new Date() });
              return res.status(200).json({ message: replyMessage });
            }
          }
        } else {
          delete sessionState[sessionId].pendingEvent;
          const replyMessage = 'Action cancelled.';
          chatHistory.push({ id: Date.now().toString(), message: userMessage, role: 'user', timestamp: new Date() });
          chatHistory.push({ id: (Date.now() + 1).toString(), message: replyMessage, role: 'assistant', timestamp: new Date() });
          return res.status(200).json({ message: replyMessage });
        }
      } else {
        // User is providing missing info for update/create
        const missingFields = pending.missingFields;
        if (missingFields && missingFields.length > 0) {
          pending[missingFields[0]] = userMessage.trim();
        }
        // Check if all required fields are now present
        const stillMissing = pending.action === 'update'
          ? ['title', 'start', 'end'].filter(f => !pending[f])
          : ['title', 'start', 'end'].filter(f => !pending[f]);
        if (stillMissing.length) {
          pending.missingFields = stillMissing;
          const replyMessage = `Please provide the following details: ${stillMissing.join(', ')}`;
          chatHistory.push({ id: Date.now().toString(), message: userMessage, role: 'user', timestamp: new Date() });
          chatHistory.push({ id: (Date.now() + 1).toString(), message: replyMessage, role: 'assistant', timestamp: new Date() });
          return res.status(200).json({ message: replyMessage });
        } else {
          pending.awaitingConfirmation = true;
          let replyMessage;
          if (pending.action === 'update') {
            replyMessage = `Please confirm: Update "${pending.title}" at ${pending.start} - ${pending.end}${pending.location ? ' in ' + pending.location : ''}? (yes/no)`;
          } else if (pending.action === 'delete') {
            replyMessage = `Please confirm: Delete event "${pending.title}" at ${pending.start} - ${pending.end}${pending.location ? ' in ' + pending.location : ''}? (yes/no)`;
          } else {
            replyMessage = `Please confirm: "${pending.title}" at ${pending.start} - ${pending.end}${pending.location ? ' in ' + pending.location : ''}. Add to calendar? (yes/no)`;
          }
          chatHistory.push({ id: Date.now().toString(), message: userMessage, role: 'user', timestamp: new Date() });
          chatHistory.push({ id: (Date.now() + 1).toString(), message: replyMessage, role: 'assistant', timestamp: new Date() });
          return res.status(200).json({ message: replyMessage });
        }
      }
    }

    // Normal flow: classify intent
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
          { headers: { Authorization: authHeader } }
        );
        const events = listRes.data;
        if (events.length === 0) {
          replyMessage = '📅 **You have no upcoming events.**';
        } else {
          // Group events by day of the week (including weekends)
          const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const grouped = {};
          for (const e of events) {
            const start = new Date(e.start.dateTime || e.start.date);
            const dayIdx = start.getDay();
            const dayName = daysOfWeek[dayIdx];
            if (!grouped[dayName]) grouped[dayName] = [];
            grouped[dayName].push(e);
          }
          // Order days as Sunday to Saturday
          let eventLines = [];
          daysOfWeek.forEach(day => {
            if (grouped[day]) {
              eventLines.push(`\n---\n#### ${day}`);
              grouped[day].forEach((e, idx) => {
                const start = new Date(e.start.dateTime || e.start.date);
                const end = new Date(e.end.dateTime || e.end.date);
                const options = { month: 'short', day: 'numeric' };
                const dateStr = start.toLocaleDateString('en-US', options);
                const startTime = e.start.dateTime
                  ? start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  : 'All day';
                const endTime = e.end.dateTime
                  ? end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  : '';
                eventLines.push(
                  `- **${e.summary || 'Untitled Event'}**` +
                  `\n  > 🗓️ ${dateStr}` +
                  `\n  > 🕒 ${startTime}${endTime ? ` - ${endTime}` : ''}` +
                  (e.location ? `\n  > 📍 ${e.location}` : '') +
                  (e.description ? `\n  > 📝 ${e.description}` : '')
                );
              });
            }
          });
          replyMessage = `📅 **Here are your upcoming events, grouped by day:**\n` + eventLines.join('\n');
        }
        break;
      }
      case 'update': {
        // grab existing list of events
        const listRes = await axios.get(
          'http://localhost:3000/api/calendar/list-events',
          { headers: { Authorization: authHeader } }
        );
        const events = listRes.data;

        // pass existing events into prompt
        const prompt = updatePrompt(userMessage, events);
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
        });
        const gptOutput = completion.choices[0].message.content;
        let parsed;
        try {
          parsed = JSON.parse(gptOutput);
        } catch {
          parsed = {};
        }
        const { eventId, title, location, description, start, end } = parsed;

        if (!eventId || eventId === "None") {
          replyMessage = "❗ **Event not found.** Please specify which event you want to update.";
          break;
        }

        // Check for missing fields
        const missingFields = ['title', 'start time', 'end time'].filter(f => !parsed[f]);
        if (missingFields.length) {
          sessionState[sessionId] = {
            pendingEvent: {
              ...parsed,
              action: 'update',
              missingFields,
              eventId,
            }
          };
          replyMessage = `⚠️ **Missing details:** ${missingFields.map(f => `\`${f}\``).join(', ')}.\n\nPlease provide the following details to update your event.`;
          chatHistory.push({ id: Date.now().toString(), message: userMessage, role: 'user', timestamp: new Date() });
          chatHistory.push({ id: (Date.now() + 1).toString(), message: replyMessage, role: 'assistant', timestamp: new Date() });
          return res.status(200).json({ message: replyMessage });
        }

        // Ask for confirmation before updating
        sessionState[sessionId] = {
          pendingEvent: {
            ...parsed,
            action: 'update',
            awaitingConfirmation: true,
            eventId,
          }
        };
        replyMessage = `❓ **Please confirm:**\n\nUpdate **${title}**\n- 🗓️ ${start} - ${end}${location ? `\n- 📍 ${location}` : ''}\n\nType \`yes\` to confirm or \`no\` to cancel.`;
        chatHistory.push({ id: Date.now().toString(), message: userMessage, role: 'user', timestamp: new Date() });
        chatHistory.push({ id: (Date.now() + 1).toString(), message: replyMessage, role: 'assistant', timestamp: new Date() });
        return res.status(200).json({ message: replyMessage });
      }

      case 'delete': {
        // grab existing list of events
        const listRes = await axios.get(
          'http://localhost:3000/api/calendar/list-events',
          { headers: { Authorization: authHeader } }
        );
        const events = listRes.data;

        // pass existing events into prompt
        const prompt = deletePrompt(userMessage, events);
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
        });
        const gptOutput = completion.choices[0].message.content;
        let parsed;
        try {
          parsed = JSON.parse(gptOutput);
        } catch {
          parsed = {};
        }
        const { eventId } = parsed;
        if (!eventId || eventId === "None") {
          replyMessage = "❗ **Event not found.** Please specify which event you want to delete.";
          break;
        }

        // Find event details for confirmation
        const event = events.find(e => e.id === eventId);
        sessionState[sessionId] = {
          pendingEvent: {
            ...event,
            action: 'delete',
            eventId,
            awaitingConfirmation: true,
            title: event?.summary || '',
            start: event?.start?.dateTime || event?.start?.date || '',
            end: event?.end?.dateTime || event?.end?.date || '',
            location: event?.location || '',
          }
        };
        replyMessage = `❓ **Please confirm:**\n\nDelete event **${event?.summary}**\n- 🗓️ ${event?.start?.dateTime || event?.start?.date || ''} - ${event?.end?.dateTime || event?.end?.date || ''}${event?.location ? `\n- 📍 ${event.location}` : ''}\n\nType \`yes\` to confirm or \`no\` to cancel.`;
        chatHistory.push({ id: Date.now().toString(), message: userMessage, role: 'user', timestamp: new Date() });
        chatHistory.push({ id: (Date.now() + 1).toString(), message: replyMessage, role: 'assistant', timestamp: new Date() });
        return res.status(200).json({ message: replyMessage });
      }

      case 'create':
      default: {
        // If the user message matches a known quick action, provide a helpful instruction instead of sending to OpenAI
        const quickActionInstructions = {
          'Add new class':
            'You can add a new class by saying something like: "Add a class called [Course Name] on [Days of week] from [start time] to [end time] in [location]".\nFor example: "Add CSE 446 on Mondays and Wednesdays from 9am to 10am in Kane Hall."',
          'Add a new event':
            'You can add a new event by saying: "Add [event name] on [date] from [start time] to [end time] in [location]".\nFor example: "Add a 2 hour Zoom meeting later today at 4pm."',
          'Change current event':
            'To update an event, say something like: "Change my meeting on Friday to 3pm" or "Update the location of my class on Monday to Smith Hall."',
          'Delete event':
            'To delete an event, say something like: "Delete my meeting on Thursday" or "Remove CSE 446 on Monday."',
        };
        if (quickActionInstructions[userMessage.trim()]) {
          replyMessage = quickActionInstructions[userMessage.trim()];
          chatHistory.push({ id: Date.now().toString(), message: userMessage, role: 'user', timestamp: new Date() });
          chatHistory.push({ id: (Date.now() + 1).toString(), message: replyMessage, role: 'assistant', timestamp: new Date() });
          return res.status(200).json({ message: replyMessage });
        }
        // Build create prompt and parse
        const prompt = createPrompt(userMessage);
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
        });
        const gptOutput = completion.choices[0].message.content;

        // Try to parse, but if missing required fields, prompt user for them
        let parsedEvent;
        try {
          parsedEvent = parseGPTResponse(gptOutput);
        } catch (err) {
          // Try to extract partial fields
          let partial;
          try {
            partial = JSON.parse(gptOutput);
          } catch {
            partial = {};
          }
          // Normalize field names for missing fields
          const requiredFields = ['title', 'start', 'end'];
          // Accept both 'start' and 'start time', 'end' and 'end time'
          const hasField = (obj, f) => obj[f] || obj[f.replace(' ', '')] || obj[f.replace(' time', '')];
          const missingFields = requiredFields.filter(f => !hasField(partial, f));
          if (missingFields.length) {
            sessionState[sessionId] = {
              pendingEvent: {
                ...partial,
                action: 'create',
                missingFields,
              }
            };
            replyMessage = `⚠️ **Missing details:** ${missingFields.map(f => `\`${f}\``).join(', ')}.\n\nPlease provide the following details to create your event.`;
            chatHistory.push({ id: Date.now().toString(), message: userMessage, role: 'user', timestamp: new Date() });
            chatHistory.push({ id: (Date.now() + 1).toString(), message: replyMessage, role: 'assistant', timestamp: new Date() });
            return res.status(200).json({ message: replyMessage });
          } else {
            // All required fields present, continue to confirmation
            // Normalize the fields for confirmation
            parsedEvent = {
              ...partial,
              title: partial.title || partial['title'],
              start: partial.start || partial['start time'],
              end: partial.end || partial['end time'],
            };
          }
        }

        // If all required fields present, ask for confirmation
        // Validate that start and end are valid ISO strings
        let invalidFields = [];
        if (parsedEvent.start && isNaN(Date.parse(parsedEvent.start))) invalidFields.push('start');
        if (parsedEvent.end && isNaN(Date.parse(parsedEvent.end))) invalidFields.push('end');
        if (invalidFields.length) {
          sessionState[sessionId] = {
            pendingEvent: {
              ...parsedEvent,
              action: 'create',
              missingFields: invalidFields,
            }
          };
          replyMessage = `⚠️ **Invalid or missing details:** ${invalidFields.map(f => `\`${f}\``).join(', ')}.\n\nPlease provide a valid value for: ${invalidFields.join(', ')}`;
          chatHistory.push({ id: Date.now().toString(), message: userMessage, role: 'user', timestamp: new Date() });
          chatHistory.push({ id: (Date.now() + 1).toString(), message: replyMessage, role: 'assistant', timestamp: new Date() });
          return res.status(200).json({ message: replyMessage });
        }

        // Custom confirmation message
        const eventStart = new Date(parsedEvent.start);
        const eventEnd = new Date(parsedEvent.end);
        const dayOfWeek = eventStart.toLocaleDateString('en-US', { weekday: 'long' });
        const monthDay = eventStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const startTime = eventStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const endTime = eventEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        let confirmMsg = `✅ **Confirm the following event:**\n\n`;
        confirmMsg += `**${parsedEvent.title}** (${dayOfWeek} - ${monthDay})\n`;
        confirmMsg += `- 🕒 ${startTime} - ${endTime}\n`;
        if (parsedEvent.location) confirmMsg += `- 📍 ${parsedEvent.location}\n`;
        if (parsedEvent.description) confirmMsg += `- 📝 ${parsedEvent.description}\n`;
        confirmMsg += `\nType \`yes\` to confirm or \`no\` to cancel.`;

        sessionState[sessionId] = {
          pendingEvent: {
            ...parsedEvent,
            action: 'create',
            awaitingConfirmation: true,
          }
        };
        replyMessage = confirmMsg;
        chatHistory.push({ id: Date.now().toString(), message: userMessage, role: 'user', timestamp: new Date() });
        chatHistory.push({ id: (Date.now() + 1).toString(), message: replyMessage, role: 'assistant', timestamp: new Date() });
        return res.status(200).json({ message: replyMessage });
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