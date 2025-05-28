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

// DELETE /api/chat/history
router.delete('/history', verifyFirebaseToken, (req, res) => {
  chatHistory = [];
  console.log('Chat history cleared');
  res.status(200).json({ message: 'Chat history cleared successfully' });
});

// POST /api/chat
router.post('/', verifyFirebaseToken, async (req, res) => {
  const userMessage = req.body.message;
  const authHeader = req.headers.authorization;
  const sessionId = req.user?.uid || req.headers['x-user-id'] || 'default';
  
  // Define required fields for event creation
  const requiredFields = ['title', 'start', 'end'];

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
            replyMessage = `❓ **Please confirm:**\n\nUpdate **${pending.title}**\n- 🗓️ From ${pending.start} to ${pending.end}${pending.location ? `\n- 📍 ${pending.location}` : ''}\n`;
          } else if (pending.action === 'delete') {
            replyMessage = `❓ **Please confirm:**\n\nDelete event **${pending.title}**\n- 🗓️ From ${pending.start} to ${pending.end}${pending.location ? `\n- 📍 ${pending.location}` : ''}\n`;
          } else {
            replyMessage = `❓ **Please confirm:**\n\nAdd to calendar: **${pending.title}**\n- 🗓️ From ${pending.start} to ${pending.end}${pending.location ? `\n- 📍 ${pending.location}` : ''}\n`;
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
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Set to beginning of today
          
          // Get today's day of week (0-6)
          const todayIdx = today.getDay();
          
          // Filter events to only include those from today onward
          const filteredEvents = events.filter(e => {
            const eventDate = new Date(e.start.dateTime || e.start.date);
            return eventDate >= today;
          });
          
          // Group by day of week
          const grouped = {};
          for (const e of filteredEvents) {
            const start = new Date(e.start.dateTime || e.start.date);
            const dayIdx = start.getDay();
            const dayName = daysOfWeek[dayIdx];
            
            // Only include days from today to Saturday (this week only)
            if (dayIdx >= todayIdx && dayIdx <= 6) {
              if (!grouped[dayName]) grouped[dayName] = [];
              grouped[dayName].push(e);
            }
          }
          
          // Determine event type for styling
          const getEventType = (summary) => {
            const lowerSummary = summary ? summary.toLowerCase() : '';
            if (lowerSummary.includes('class') || lowerSummary.includes('lecture') || lowerSummary.includes('course')) {
              return 'class-event';
            } else if (lowerSummary.includes('meeting') || lowerSummary.includes('appointment') || lowerSummary.includes('call')) {
              return 'meeting-event';
            } else if (lowerSummary.includes('deadline') || lowerSummary.includes('due') || lowerSummary.includes('assignment')) {
              return 'deadline-event';
            } else {
              return '';
            }
          };
          
          // Get appropriate emoji for event type
          const getEventEmoji = (summary) => {
            const lowerSummary = summary ? summary.toLowerCase() : '';
            if (lowerSummary.includes('class') || lowerSummary.includes('lecture') || lowerSummary.includes('course')) {
              return '📚';
            } else if (lowerSummary.includes('meeting') || lowerSummary.includes('appointment')) {
              return '👥';
            } else if (lowerSummary.includes('call') || lowerSummary.includes('zoom')) {
              return '📞';
            } else if (lowerSummary.includes('deadline') || lowerSummary.includes('due')) {
              return '⏰';
            } else if (lowerSummary.includes('assignment') || lowerSummary.includes('homework')) {
              return '📝';
            } else {
              return '📌';
            }
          };
          
          // Create a more visually appealing markdown output for events
          let eventLines = [];
          eventLines.push('## EVENTS THIS WEEK');
          
          daysOfWeek.forEach(day => {
            if (grouped[day]) {
              eventLines.push(`\n\n#### ${day}`);
              
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
                const eventType = getEventType(e.summary);
                
                // Create a cleaner, single line format with consistent styling
                eventLines.push(`- **${e.summary || 'Untitled Event'}** | ${startTime}${endTime ? ` - ${endTime}` : ''} [✏️](command:edit:${e.id}) [🗑️](command:delete:${e.id})`);
              });
            }
          });
          
          replyMessage = eventLines.join('\n');
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

        // Find the existing event to use for missing details
        const existingEvent = events.find(e => e.id === eventId);
        if (!existingEvent) {
          replyMessage = "❗ **Event not found.** Please specify which event you want to update.";
          break;
        }

        // Merge existing event details with updates
        const updateData = {
          eventId,
          title: title || existingEvent.summary,
          location: location || existingEvent.location,
          description: description || existingEvent.description,
          start: start || existingEvent.start.dateTime || existingEvent.start.date,
          end: end || existingEvent.end.dateTime || existingEvent.end.date
        };

        // Ask for confirmation before updating
        sessionState[sessionId] = {
          pendingEvent: {
            ...updateData,
            action: 'update',
            awaitingConfirmation: true,
            eventId,
          }
        };
        
        // Format times for better readability
        const startDate = new Date(updateData.start);
        const endDate = new Date(updateData.end);
        const formattedStart = startDate.toLocaleString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric', 
          hour: 'numeric', minute: 'numeric'
        });
        const formattedEnd = endDate.toLocaleTimeString('en-US', {
          hour: 'numeric', minute: 'numeric'
        });
        
        replyMessage = `❓ **Please confirm:**\n\nUpdate **${updateData.title}**\n- 🗓️ ${formattedStart} - ${formattedEnd}${updateData.location ? `\n- 📍 ${updateData.location}` : ''}\n`;
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
        
        // Format dates for readability
        const startDate = new Date(event?.start?.dateTime || event?.start?.date || '');
        const endDate = new Date(event?.end?.dateTime || event?.end?.date || '');
        const formattedStart = startDate.toLocaleString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric', 
          hour: 'numeric', minute: 'numeric'
        });
        const formattedEnd = endDate.toLocaleTimeString('en-US', {
          hour: 'numeric', minute: 'numeric'
        });
        
        replyMessage = `❓ **Please confirm:**\n\nDelete event **${event?.summary}**\n- 🗓️ ${formattedStart} - ${formattedEnd}${event?.location ? `\n- 📍 ${event.location}` : ''}\n`;
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
          const hasField = (obj, f, action = 'create') => {
            // Check direct field name
            if (obj[f]) return true;
            
            // Check with spaces removed (e.g., "starttime" -> "start time")
            if (obj[f.replace(' ', '')]) return true;
            
            // Check with "time" suffix added/removed
            if (f === 'start' && obj['start time']) return true;
            if (f === 'end' && obj['end time']) return true;
            if (f === 'start time' && obj['start']) return true;
            if (f === 'end time' && obj['end']) return true;
            
            // For updates, we should be more lenient - only require event ID
            if (action === 'update' && obj.eventId) return true;
            
            return false;
          };
          
          // For create actions, require all fields; for update actions, be more lenient
          const action = partial.eventId ? 'update' : 'create';
          const fieldsToCheck = action === 'update' 
            ? [] // For updates, we'll use the existing event data for missing fields
            : requiredFields;
            
          const missingFields = fieldsToCheck.filter(f => !hasField(partial, f, action));
          if (missingFields.length) {
            sessionState[sessionId] = {
              pendingEvent: {
                ...partial,
                action: action,
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