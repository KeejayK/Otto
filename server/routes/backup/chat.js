const express = require('express');
const router = express.Router();
const axios = require('axios');
const { OpenAI } = require('openai');
const { classifyIntent } = require('../services/nlp/classifyIntent');
const { createPrompt, updatePrompt, deletePrompt, createFollowUpPrompt } = require('../services/nlp/gptPromptManager');
const { parseGPTResponse } = require('../services/nlp/parseResponse');
const { formatDate, parseTimeAndApplyToDate, toISOString } = require('../services/nlp/timeHelper');

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
              console.log("Updating event with data:", {
                eventId: pending.eventId,
                summary: pending.title,
                location: pending.location,
                description: pending.description,
                start: pending.start,
                end: pending.end
              });
              
              // Handle both ISO string dates and time-only values
              let startISOString = pending.start;
              let endISOString = pending.end;
              
              // Check if we need to parse time-only values
              if (pending.start && (!pending.start.includes('T') || pending.start.includes(':'))) {
                // This might be a time-only value like "5pm" or "17:00"
                const timePattern = /(\d{1,2})(?::(\d{1,2}))?\s*(am|pm|AM|PM)?/;
                if (timePattern.test(pending.start)) {
                  // Get the event from the API to get current date
                  try {
                    const eventRes = await axios.get(
                      `http://localhost:3000/api/calendar/get-event/${pending.eventId}`,
                      { headers: { Authorization: authHeader } }
                    );
                    
                    const existingEvent = eventRes.data;
                    const existingStart = existingEvent.start.dateTime || existingEvent.start.date;
                    const existingEnd = existingEvent.end.dateTime || existingEvent.end.date;
                    
                    // Parse the time-only value and apply it to the existing date
                    const match = pending.start.match(timePattern);
                    if (match) {
                      let hours = parseInt(match[1], 10);
                      const minutes = match[2] ? parseInt(match[2], 10) : 0;
                      const ampm = match[3] ? match[3].toLowerCase() : null;
                      
                      // Adjust hours for AM/PM
                      if (ampm === 'pm' && hours < 12) {
                        hours += 12;
                      } else if (ampm === 'am' && hours === 12) {
                        hours = 0;
                      } else if (!ampm && pending.start.includes(':')) {
                        // If format is "HH:MM" with no AM/PM, assume 24-hour format
                        // hours is already correct, no adjustment needed
                      }
                      
                      // Apply the new time to the existing date
                      const existingStartDate = new Date(existingStart);
                      existingStartDate.setHours(hours, minutes, 0, 0);
                      startISOString = existingStartDate.toISOString();
                      
                      // If no end time was specified, maintain the same duration
                      if (!pending.end || pending.end === '') {
                        const existingStartTime = new Date(existingStart).getTime();
                        const existingEndTime = new Date(existingEnd).getTime();
                        const duration = existingEndTime - existingStartTime;
                        
                        const newEndTime = existingStartDate.getTime() + duration;
                        endISOString = new Date(newEndTime).toISOString();
                      }
                    }
                  } catch (err) {
                    console.error("Error fetching existing event:", err);
                  }
                }
              }
              
              // Do the same for end time if it's a time-only value
              if (pending.end && (!pending.end.includes('T') || pending.end.includes(':'))) {
                const timePattern = /(\d{1,2})(?::(\d{1,2}))?\s*(am|pm|AM|PM)?/;
                if (timePattern.test(pending.end) && startISOString) {
                  // Use the start date but with the end time
                  const match = pending.end.match(timePattern);
                  if (match) {
                    let hours = parseInt(match[1], 10);
                    const minutes = match[2] ? parseInt(match[2], 10) : 0;
                    const ampm = match[3] ? match[3].toLowerCase() : null;
                    
                    // Adjust hours for AM/PM
                    if (ampm === 'pm' && hours < 12) {
                      hours += 12;
                    } else if (ampm === 'am' && hours === 12) {
                      hours = 0;
                    } else if (!ampm && pending.end.includes(':')) {
                      // If format is "HH:MM" with no AM/PM, assume 24-hour format
                      // hours is already correct, no adjustment needed
                    }
                    
                    // Apply the new time to the same date as start
                    const endDate = new Date(startISOString);
                    endDate.setHours(hours, minutes, 0, 0);
                    endISOString = endDate.toISOString();
                  }
                }
              } else if (!endISOString) {
                // If endISOString is still not set, use whatever was in pending.end
                const endDate = new Date(pending.end);
                if (!isNaN(endDate.getTime())) {
                  endISOString = endDate.toISOString();
                }
              }
              
              console.log("Final update payload:", {
                eventId: pending.eventId,
                summary: pending.title,
                location: pending.location,
                description: pending.description,
                start: startISOString,
                end: endISOString,
              });
              
              const updateRes = await axios.put(
                'http://localhost:3000/api/calendar/modify-event',
                {
                  eventId: pending.eventId,
                  summary: pending.title,
                  location: pending.location,
                  description: pending.description,
                  start: startISOString,
                  end: endISOString,
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
                  recurrence: pending.recurrence || null,
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
          // When input is not a confirmation, simply delete the pending event without responding
          delete sessionState[sessionId].pendingEvent;
          
          // Continue to process the message as a new request
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
          
          // Use createFollowUpPrompt for a more conversational follow-up
          const missingInfo = stillMissing[0]; // Get the first missing field
          const prompt = createFollowUpPrompt(missingInfo, pending);
          
          // Get a conversational prompt for the missing information
          const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
          });
          
          // Use the AI-generated follow-up question
          const replyMessage = completion.choices[0].message.content;
          
          chatHistory.push({ id: Date.now().toString(), message: userMessage, role: 'user', timestamp: new Date() });
          chatHistory.push({ id: (Date.now() + 1).toString(), message: replyMessage, role: 'assistant', timestamp: new Date() });
          return res.status(200).json({ message: replyMessage });
        } else {
          pending.awaitingConfirmation = true;
          let replyMessage;
          if (pending.action === 'update') {
            replyMessage = `❓ **Please confirm:**\n\nUpdate: **${pending.title}**\n- 🗓️ From ${pending.start} to ${pending.end}${pending.location ? `\n- 📍 ${pending.location}` : ''}\n\n`;
          } else if (pending.action === 'delete') {
            replyMessage = `❓ **Please confirm:**\n\nDelete: **${pending.title}**\n- 🗓️ From ${pending.start} to ${pending.end}${pending.location ? `\n- 📍 ${pending.location}` : ''}\n\n`;
          } else {
            replyMessage = `❓ **Please confirm:**\n\nAdd to calendar: **${pending.title}**\n- 🗓️ From ${pending.start} to ${pending.end}${pending.location ? `\n- 📍 ${pending.location}` : ''}\n\n`;
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

    // Special case for greetings before handling unclear inputs
    const greetingPattern = /^(hi|hello|hey|greetings|howdy|hi there|hey there|hello there|good morning|good afternoon|good evening)$/i;
    if (greetingPattern.test(userMessage.trim())) {
      const currentHour = new Date().getHours();
      let greeting = "Hello";
      
      if (currentHour < 12) {
        greeting = "Good morning";
      } else if (currentHour < 18) {
        greeting = "Good afternoon";
      } else {
        greeting = "Good evening";
      }
      
      const replyMessage = `${greeting}! 👋 I'm your calendar assistant. I can help you manage your schedule.

What would you like to do today? You can ask me to:
- Create a new event
- Check your schedule
- Update an existing event
- Remove an event from your calendar`;
      
      chatHistory.push({ id: Date.now().toString(), message: userMessage, role: 'user', timestamp: new Date() });
      chatHistory.push({ id: (Date.now() + 1).toString(), message: replyMessage, role: 'assistant', timestamp: new Date() });
      return res.status(200).json({ message: replyMessage });
    }

    // Handle unclear input specifically when classified as 'unclear'
    if (intent === 'unclear') {
      // More helpful response that guides the user on what they can say
      const replyMessage = ` I didn’t quite get that. 
      Try something like:

📅 **Create:** "Add meeting with John tomorrow at 3pm" 

🔄 **Update:** "Change my Friday meeting to 2pm"

❌ **Delete:** "Cancel my dentist appointment" 

📋 **View:** "Show events this week"`;
      
      chatHistory.push({ id: Date.now().toString(), message: userMessage, role: 'user', timestamp: new Date() });
      chatHistory.push({ id: (Date.now() + 1).toString(), message: replyMessage, role: 'assistant', timestamp: new Date() });
      return res.status(200).json({ message: replyMessage });
    }

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
          
          // Calculate the end of the current week (Saturday 23:59:59)
          const endOfWeek = new Date(today);
          endOfWeek.setDate(today.getDate() + (6 - todayIdx)); // Go to Saturday
          endOfWeek.setHours(23, 59, 59, 999); // End of day
          
          // Filter events to only include those from today to end of week
          const filteredEvents = events.filter(e => {
            const eventDate = new Date(e.start.dateTime || e.start.date);
            return eventDate >= today && eventDate <= endOfWeek;
          });
          
          // Group by day of week
          const grouped = {};
          for (const e of filteredEvents) {
            const start = new Date(e.start.dateTime || e.start.date);
            const dayIdx = start.getDay();
            const dayName = daysOfWeek[dayIdx];
            
            if (!grouped[dayName]) grouped[dayName] = [];
            grouped[dayName].push(e);
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
          
          // Get date object for organized display
          const getDateForDay = (day) => {
            const today = new Date();
            const todayDayIndex = today.getDay(); // 0 (Sunday) to 6 (Saturday)
            const dayIndex = daysOfWeek.indexOf(day);
            const diff = dayIndex - todayDayIndex;
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + diff);
            return targetDate;
          };
          
          daysOfWeek.forEach(day => {
            if (grouped[day]) {
              // Format day headers similar to the calendar view (DAY, MONTH DAY)
              const dateForDay = getDateForDay(day);
              const dayNumber = dateForDay.getDate();
              const monthAbbrev = dateForDay.toLocaleString('en-US', { month: 'short' }).toUpperCase();
              
              // Add day heading with spacing between day/date and extra spacing between days
              eventLines.push(`\n\n### ${dayNumber} ${monthAbbrev}   ${day.substring(0, 3).toUpperCase()}`);
              
              grouped[day].forEach((e, idx) => {
                const start = new Date(e.start.dateTime || e.start.date);
                const end = new Date(e.end.dateTime || e.end.date);
                const startTime = e.start.dateTime
                  ? start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                  : 'All day';
                const endTime = e.end.dateTime
                  ? end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                  : '';
                
                // Create a cleaner, single line format with consistent styling and more spacing
                eventLines.push(`-   *${startTime}${endTime ? ` - ${endTime}` : ''}*   ${e.summary || 'Untitled Event'} [Delete](command:delete:${e.id})`);
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
          // Find where the JSON starts/ends in GPT output
          const jsonStart = gptOutput.indexOf('{');
          const jsonEnd = gptOutput.lastIndexOf('}') + 1;
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            const jsonString = gptOutput.slice(jsonStart, jsonEnd);
            parsed = JSON.parse(jsonString);
          } else {
            parsed = JSON.parse(gptOutput); // Try parsing the whole output
          }
          
          console.log("Parsed JSON from GPT:", JSON.stringify(parsed));
          
          // Debug log for day-of-week changes
          const dayOfWeekPattern = /\b(mon(day)?|tues?(day)?|wed(nesday)?|thur?s?(day)?|fri(day)?|sat(urday)?|sun(day)?)\b/i;
          if (dayOfWeekPattern.test(userMessage)) {
            console.log("Day change detected in message:", userMessage);
            console.log("GPT response for day change:", parsed);
          }
        } catch (error) {
          console.error("Error parsing JSON:", error, "Raw output:", gptOutput);
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

        // Get the existing start and end times
        const existingStart = existingEvent.start.dateTime || existingEvent.start.date;
        const existingEnd = existingEvent.end.dateTime || existingEvent.end.date;
        
        let finalStart = existingStart;
        let finalEnd = existingEnd;
        
        console.log("Existing times:", { existingStart, existingEnd });
        console.log("Update times:", { start, end });
        
        // Check for day of week patterns in the user's message regardless of whether start/end is provided
        const dayOfWeekPattern = /\b(mon(day)?|tues?(day)?|wed(nesday)?|thur?s?(day)?|fri(day)?|sat(urday)?|sun(day)?)\b/i;
        const relativeDayPattern = /\b(tomorrow|next\s+week)\b/i;
        const dayOfWeekMatch = userMessage.match(dayOfWeekPattern);
        const relativeDayMatch = userMessage.match(relativeDayPattern);
        
        // Get full day name from any abbreviation
        const getDayFullName = (match) => {
          const day = match.toLowerCase();
          if (day.startsWith('mon')) return 'monday';
          if (day.startsWith('tue')) return 'tuesday';
          if (day.startsWith('wed')) return 'wednesday';
          if (day.startsWith('thu')) return 'thursday';
          if (day.startsWith('fri')) return 'friday';
          if (day.startsWith('sat')) return 'saturday';
          if (day.startsWith('sun')) return 'sunday';
          return null;
        };
        
        // Handle day of week changes even if GPT returns empty time fields
        if ((dayOfWeekMatch || relativeDayMatch) && (!start || start === '')) {
          // Handle specific day names
          if (dayOfWeekMatch) {
            const dayName = getDayFullName(dayOfWeekMatch[0]);
            
            if (dayName) {
              // Set the date to the next occurrence of the specified day
              const { getNextDayOfWeek } = require('../services/nlp/timeHelper');
              const targetDate = getNextDayOfWeek(dayName);
              
              if (targetDate) {
                // Keep the original event time on the new day
                const originalTime = new Date(existingStart);
                targetDate.setHours(originalTime.getHours(), originalTime.getMinutes(), 0, 0);
                
                finalStart = targetDate.toISOString();
                console.log(`Applied day change to next ${dayName} from message:`, finalStart);
              }
            }
          } 
          // Handle relative days like "tomorrow" or "next week"
          else if (relativeDayMatch) {
            const relativeDay = relativeDayMatch[1].toLowerCase();
            const originalTime = new Date(existingStart);
            let targetDate = new Date(originalTime);
            
            if (relativeDay === 'tomorrow') {
              targetDate.setDate(targetDate.getDate() + 1);
            } else if (relativeDay.includes('next week')) {
              targetDate.setDate(targetDate.getDate() + 7);
            }
            
            finalStart = targetDate.toISOString();
            console.log(`Applied relative day change to ${relativeDay}:`, finalStart);
          }
          
          // Adjust end time to maintain duration for any day change
          if (finalStart !== existingStart) {
            const existingStartTime = new Date(existingStart).getTime();
            const existingEndTime = new Date(existingEnd).getTime();
            const duration = existingEndTime - existingStartTime;
            
            const newStartDate = new Date(finalStart);
            const newEndDate = new Date(newStartDate.getTime() + duration);
            finalEnd = newEndDate.toISOString();
            console.log("Adjusted end time to maintain duration for day change:", finalEnd);
          }
        }
        
        // Only update times if provided in the update
        if (start) {
          try {
            // Check for day of week patterns in the user's message
            const dayOfWeekMatch = userMessage.match(dayOfWeekPattern);
            
            // Get full day name from any abbreviation
            const getDayFullName = (match) => {
              const day = match.toLowerCase();
              if (day.startsWith('mon')) return 'monday';
              if (day.startsWith('tue')) return 'tuesday';
              if (day.startsWith('wed')) return 'wednesday';
              if (day.startsWith('thu')) return 'thursday';
              if (day.startsWith('fri')) return 'friday';
              if (day.startsWith('sat')) return 'saturday';
              if (day.startsWith('sun')) return 'sunday';
              return null;
            };
            
            // Check if the start time appears to be a full ISO string or just a time reference
            const startContainsTime = start.includes('T') || start.includes(':');
            
            // Check if start date string has a date component we should validate for day of week correctness
            // This is needed because the GPT might generate a date for the wrong day of the week
            if (startContainsTime && start.includes('T') && dayOfWeekMatch) {
              const dayName = getDayFullName(dayOfWeekMatch[0]);
              const requestedDay = dayName ? dayName.toLowerCase() : null;
              
              // Try to parse the date
              const startDate = new Date(start);
              if (!isNaN(startDate.getTime())) {
                // Check if the date's day of week matches the requested day of week
                const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const dateDay = dayNames[startDate.getDay()];
                
                if (requestedDay && dateDay !== requestedDay) {
                  console.log(`Day of week mismatch: Requested ${requestedDay} but date is ${dateDay}. Correcting...`);
                  
                  // Get the correct date for the requested day of week
                  const { getNextDayOfWeek } = require('../services/nlp/timeHelper');
                  const correctedDate = getNextDayOfWeek(requestedDay);
                  
                  // Keep the time part from the originally parsed date
                  correctedDate.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);
                  
                  finalStart = correctedDate.toISOString();
                  console.log(`Corrected start date to ${requestedDay}:`, finalStart);
                } else {
                  // Date is valid and day of week is correct
                  finalStart = startDate.toISOString();
                  console.log("Updated start time from full date:", finalStart);
                }
              } else {
                console.error("Invalid start time format provided:", start);
                // If there's a day of week mention in the message but GPT failed to parse it correctly
                if (dayOfWeekMatch) {
                  const dayName = getDayFullName(dayOfWeekMatch[0]);
                  
                  if (dayName) {
                    // Set the date to the next occurrence of the specified day
                    const { getNextDayOfWeek } = require('../services/nlp/timeHelper');
                    const targetDate = getNextDayOfWeek(dayName);
                    
                    if (targetDate) {
                      // Keep the original event time on the new day
                      const originalTime = new Date(existingStart);
                      targetDate.setHours(originalTime.getHours(), originalTime.getMinutes(), 0, 0);
                      
                      finalStart = targetDate.toISOString();
                      console.log(`Corrected start date to next ${dayName}:`, finalStart);
                    }
                  }
                }
              }
            } else {
              // This might be a simple time like "5pm" or "17:00" - use the existing date but update time
              const existingStartDate = new Date(existingStart);
              const timePattern = /(\d{1,2})(?::(\d{1,2}))?\s*(am|pm|AM|PM)?/;
              const match = start.match(timePattern);
              
              if (match) {
                let hours = parseInt(match[1], 10);
                const minutes = match[2] ? parseInt(match[2], 10) : 0;
                const ampm = match[3] ? match[3].toLowerCase() : null;
                
                // Adjust hours for AM/PM
                if (ampm === 'pm' && hours < 12) {
                  hours += 12;
                } else if (ampm === 'am' && hours === 12) {
                  hours = 0;
                } else if (!ampm && start.includes(':')) {
                  // If format is "HH:MM" with no AM/PM, assume 24-hour format
                  // hours is already correct, no adjustment needed
                }
                
                existingStartDate.setHours(hours, minutes, 0, 0);
                finalStart = existingStartDate.toISOString();
                console.log("Updated start time from time-only value:", finalStart);
              }
            }
            
            // If only start time was updated but not end time, adjust end time to maintain duration
            if (!end || finalStart !== existingStart) {
              const existingStartDate = new Date(existingStart);
              const existingEndDate = new Date(existingEnd);
              const duration = existingEndDate - existingStartDate; // duration in ms
              
              const newStartDate = new Date(finalStart);
              const newEndDate = new Date(newStartDate.getTime() + duration);
              finalEnd = newEndDate.toISOString();
              console.log("Adjusted end time to maintain duration:", finalEnd);
            }
          } catch (error) {
            console.error("Error processing start time:", error);
          }
        }
        
        if (end) {
          try {
            // Similar logic for end time
            const endContainsTime = end.includes('T') || end.includes(':');
            if (endContainsTime && end.includes('T')) {
              const endDate = new Date(end);
              if (!isNaN(endDate.getTime())) {
                finalEnd = endDate.toISOString();
                console.log("Updated end time from full date:", finalEnd);
              } else {
                console.error("Invalid end time format provided:", end);
                
                // If we've already corrected the start time based on day of week, adjust end time to maintain duration
                if (finalStart !== existingStart) {
                  const existingStartTime = new Date(existingStart).getTime();
                  const existingEndTime = new Date(existingEnd).getTime();
                  const duration = existingEndTime - existingStartTime;
                  
                  const newStartDate = new Date(finalStart);
                  const newEndDate = new Date(newStartDate.getTime() + duration);
                  finalEnd = newEndDate.toISOString();
                  console.log("Adjusted end time to maintain duration after day change:", finalEnd);
                }
              }
            } else {
              // Handle time-only specifications for end time
              const existingEndDate = new Date(finalEnd);  // Use already adjusted finalEnd
              const timePattern = /(\d{1,2})(?::(\d{1,2}))?\s*(am|pm|AM|PM)?/;
              const match = end.match(timePattern);
              
              if (match) {
                let hours = parseInt(match[1], 10);
                const minutes = match[2] ? parseInt(match[2], 10) : 0;
                const ampm = match[3] ? match[3].toLowerCase() : null;
                
                // Adjust hours for AM/PM
                if (ampm === 'pm' && hours < 12) {
                  hours += 12;
                } else if (ampm === 'am' && hours === 12) {
                  hours = 0;
                } else if (!ampm && end.includes(':')) {
                  // If format is "HH:MM" with no AM/PM, assume 24-hour format
                  // hours is already correct, no adjustment needed
                }
                
                existingEndDate.setHours(hours, minutes, 0, 0);
                finalEnd = existingEndDate.toISOString();
                console.log("Updated end time from time-only value:", finalEnd);
              }
            }
          } catch (error) {
            console.error("Error processing end time:", error);
          }
        }          // Format for display
        const startDate = new Date(finalStart);
        console.log("startDate parsed:", startDate);
        const endDate = new Date(finalEnd);
        console.log("endDate parsed:", endDate);

        // Merge existing event details with updates
        const updateData = {
          eventId,
          title: title || existingEvent.summary,
          location: location !== undefined ? location : (existingEvent.location || ''),
          description: description !== undefined ? description : (existingEvent.description || ''),
          start: finalStart,
          end: finalEnd
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
        
        // Format times for better readability - ensure PM/AM is displayed
        const formattedStart = startDate.toLocaleString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric', 
          hour: 'numeric', minute: 'numeric', hour12: true
        });
        const formattedEnd = endDate.toLocaleTimeString('en-US', {
          hour: 'numeric', minute: 'numeric', hour12: true
        });
        
        console.log("Formatted times for display:", formattedStart, formattedEnd);
        
        replyMessage = `❓ **Please confirm:**\n\nUpdate **${updateData.title}**\n- 🗓️ ${formattedStart} - ${formattedEnd}${updateData.location ? `\n- 📍 ${updateData.location}` : ''}\n\n`;
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
        
        replyMessage = `❓ **Please confirm:**\n\nDelete: **${event?.summary}**\n- 🗓️ ${formattedStart} - ${formattedEnd}${event?.location ? `\n- 📍 ${event.location}` : ''}\n\nSay "yes" to confirm, or ask me something else.\n`;
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
            
            // Use createFollowUpPrompt for a better, more conversational follow-up
            const missingInfo = missingFields[0]; // Get the first missing field
            const prompt = createFollowUpPrompt(missingInfo, partial);
            
            // Get a conversational prompt for the missing information
            const completion = await openai.chat.completions.create({
              model: 'gpt-3.5-turbo',
              messages: [{ role: 'user', content: prompt }],
            });
            
            // Use the AI-generated follow-up question
            const replyMessage = completion.choices[0].message.content;
            
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
        
        // Process recurrence field if it exists
        if (parsedEvent.recurrence && !Array.isArray(parsedEvent.recurrence)) {
          parsedEvent.recurrence = [parsedEvent.recurrence];
        }
        
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
        
        // Add recurring info to confirmation message if relevant
        if (parsedEvent.recurrence && parsedEvent.recurrence.length > 0) {
          // Extract recurrence information for display
          const recurrenceRule = parsedEvent.recurrence[0];
          let recurrenceText = "- 🔁 Repeats ";
          
          if (recurrenceRule.includes("FREQ=DAILY")) {
            recurrenceText += "daily";
          } else if (recurrenceRule.includes("FREQ=WEEKLY")) {
            recurrenceText += "weekly";
            
            // Extract days
            const bydayMatch = recurrenceRule.match(/BYDAY=([^;]+)/);
            if (bydayMatch) {
              const days = bydayMatch[1].split(',');
              const dayNames = {
                MO: "Monday", TU: "Tuesday", WE: "Wednesday", 
                TH: "Thursday", FR: "Friday", SA: "Saturday", SU: "Sunday"
              };
              
              if (days.length === 7) {
                recurrenceText += " every day";
              } else if (days.length === 5 && 
                        ['MO','TU','WE','TH','FR'].every(day => days.includes(day))) {
                recurrenceText += " every weekday";
              } else if (days.length === 2 && days.includes('SA') && days.includes('SU')) {
                recurrenceText += " every weekend";
              } else {
                recurrenceText += ` on ${days.map(d => dayNames[d]).join(', ')}`;
              }
            }
          }
          
          // Extract end date
          const untilMatch = recurrenceRule.match(/UNTIL=(\d{8})/);
          if (untilMatch) {
            const year = untilMatch[1].substring(0, 4);
            const month = untilMatch[1].substring(4, 6);
            const day = untilMatch[1].substring(6, 8);
            recurrenceText += ` until ${month}/${day}/${year}`;
          }
          
          confirmMsg += `${recurrenceText}\n`;
        }
        
        if (parsedEvent.location) confirmMsg += `- 📍 ${parsedEvent.location}\n`;
        if (parsedEvent.description) confirmMsg += `- 📝 ${parsedEvent.description}\n`;

        // Format confirmation message differently if it's a recurring event
        const isRecurring = parsedEvent.recurrence && parsedEvent.recurrence.length > 0;
        
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