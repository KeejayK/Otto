function formatTimeForPrompt() {
  const now = new Date();
  return {
    date: now.toLocaleDateString('en-CA'),
    time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
    dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
    hour24: now.getHours(),
    minute: now.getMinutes()
  };
}

function createPrompt(userInput) {
  const timeContext = formatTimeForPrompt();
  
  return `
You are an expert assistant that extracts calendar event details from natural language input.

IMPORTANT CONTEXT:
- Today is ${timeContext.date} (${timeContext.dayOfWeek})
- Current time is approximately ${timeContext.time}
- The user wants to create a calendar event

Parse the following message and return a JSON object with these fields:
- title: string (clear, concise name for the event)
- location: string (where the event takes place, empty if not specified)
- description: string (additional notes about the event, empty if not specified)
- start: string (ISO 8601 format, e.g., "2025-05-06T10:00")
- end: string (ISO 8601 format)

INTERPRETATION RULES:

1. For relative dates:
   - "Today" refers to current date
   - "Tomorrow" refers to next day
   - "Next [day]" refers to the next occurrence of that weekday
   - Day names refer to the upcoming occurrence of that day

2. For durations:
   - Meetings/calls: 30-60 minutes (default: 60 min)
   - Classes/lectures: 50-90 minutes (default: 60 min)
   - Lunches/coffees: 60 minutes
   - Dinners: 60 minutes
   - Appointments: 60 minutes
   - Conferences/workshops: full day (9 AM - 5 PM)

2. For recurring events mentions:
   - Check for patterns like "every Monday", "weekly", "daily", etc.
   - For recurring events, include a "recurrence" array field in the response containing RRULE strings (https://tools.ietf.org/html/rfc5545#section-3.8.5)
   - Examples:
     - For "every Monday": ["RRULE:FREQ=WEEKLY;BYDAY=MO"]
     - For "every Monday and Wednesday": ["RRULE:FREQ=WEEKLY;BYDAY=MO,WE"]
     - For "every weekday": ["RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR"]
     - For "every day": ["RRULE:FREQ=DAILY"]
     - If there is an end date, include "UNTIL=YYYYMMDD" in the RRULE
   - Still provide specific start and end times for the first occurrence

Message: "${userInput}"

Respond only with a valid JSON object. Do not include any explanation or extra text.
  `;
}

function updatePrompt(userInput, events) {
  const timeContext = formatTimeForPrompt();
  
  // Enhanced event listing with more structured information
  const listText = events.length
    ? events
        .map(e => {
          const startTime = e.start.dateTime || e.start.date;
          const endTime = e.end.dateTime || e.end.date;
          const start = startTime ? new Date(startTime).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric', 
            minute: 'numeric'
          }) : 'unknown time';
          const end = endTime ? new Date(endTime).toLocaleTimeString('en-US', {
            hour: 'numeric', 
            minute: 'numeric'
          }) : '';
          
          return `ID: ${e.id}
Title: ${e.summary || 'Untitled'}
When: ${start}${end ? ` to ${end}` : ''}
Raw Start: ${startTime}
Raw End: ${endTime}
${e.location ? `Location: ${e.location}\n` : ''}`;
        })
        .join('\n\n')
    : 'You have no upcoming events.';

  return `
You are an expert calendar assistant tasked with identifying and updating existing calendar events.

IMPORTANT CONTEXT:
- Today is ${timeContext.date} (${timeContext.dayOfWeek})
- The user wants to modify an existing event
- Current time is ${timeContext.time}

USER'S CALENDAR EVENTS:
${listText}

TASK:
Analyze the user's message and determine which event they want to modify and what changes they want to make.

INSTRUCTIONS:
1. First, identify which event is being referenced based on:
   - Exact or partial title match
   - Date/time references
   - Location references
   - Contextual clues in the message

2. Then determine which properties the user wants to update:
   - New title/name
   - New date
   - New time (start and/or end)
   - New location
   - New description/details

3. Return a JSON with these fields:
   - eventId: string (the ID of the event to update, "None" if no match found)
   - title: string (new title if changing, empty string if not changing)
   - location: string (new location if changing, empty string if not changing)
   - description: string (new description if changing, empty string if not changing)
   - start: string (new start time - IMPORTANT: if changing only the time and not the date, simply return the time like "5pm" or "17:00")
   - end: string (new end time - IMPORTANT: if changing only the time and not the date, simply return the time like "6pm" or "18:00")

4. For date/time modifications:
   - Convert all times to ISO 8601 format with timezone
   - Be precise with dates, inferring current month/year for relative references
   - For partial updates (e.g., just changing the time), preserve the original date but change the time component
   - If only time is mentioned (e.g., "change to 3pm"), keep the same date but update the hours and minutes

TIME CONVERSION RULES:
- If user says "change to 1pm", interpret this as 13:00:00 (1:00 PM) on the same day as the original event
- If user says "change to 5pm", interpret this as 17:00:00 (5:00 PM) on the same day as the original event

DAY OF WEEK CONVERSION RULES:
- Today is ${timeContext.date} (${timeContext.dayOfWeek})
- If user says "move to Tuesday" or "change to Tuesday", find the NEXT Tuesday from today (${timeContext.date})
- If that day is today, and they say "move to [today's day]", keep the same date as the event's original date
- If the target day of week is earlier than today's day of week, the next occurrence is in the next week
- Always preserve the original event's time when only changing the day of week

IMPORTANT FOR DAY OF WEEK CHANGES:
- If the user ONLY mentions changing to a day of week (like "change to Monday" or "move to Wednesday"),
  you should return an EMPTY string for "start" and "end" fields and let the backend handle the actual date calculation
- This is different from other updates where you would include specific values
- If they specify both a day AND time (like "move to Monday at 3pm"), then include the full date in ISO format

OTHER RULES:
- If user says "change to tomorrow at 2pm", change both date and time components
- If only specifying a start time change, adjust end time to maintain the original duration
- Always convert time exactly as specified - if user says 5pm, use 17:00:00, not any other time

USER'S MESSAGE: "${userInput}"

EXAMPLES:
- If user says "change my meeting to 5pm":
  {
    "eventId": "abc123",
    "title": "",
    "location": "",
    "description": "",
    "start": "5pm",
    "end": ""
  }
- If user says "move my meeting to Tuesday" or "change to Tuesday":
  {
    "eventId": "abc123",
    "title": "",
    "location": "",
    "description": "",
    "start": "",  # IMPORTANT: Leave empty for day-of-week only changes 
    "end": ""     # The backend will calculate the correct date
  }
- If user says "change test to Tuesday at 3pm":
  {
    "eventId": "abc123",
    "title": "",
    "location": "",
    "description": "",
    "start": "2025-06-03T15:00:00-07:00",  # Next Tuesday with specified time
    "end": ""  # End time will be adjusted in code to maintain original duration
  }
- If user says "update my meeting title to Team Standup":
  {
    "eventId": "abc123",
    "title": "Team Standup",
    "location": "",
    "description": "",
    "start": "",
    "end": ""
  }
- If user wants to change both time and date explicitly:
  {
    "eventId": "abc123",
    "title": "",
    "location": "",
    "description": "",
    "start": "2025-06-05T17:00:00.000Z",
    "end": "2025-06-05T18:00:00.000Z"
  }

Return ONLY a valid JSON object with the fields above. No explanations or additional text.
  `;
}

function deletePrompt(userInput, events) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  const now = new Date();
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
  
  // Enhanced event listing with more structured information
  const listText = events.length
    ? events
        .map(e => {
          const startTime = e.start.dateTime || e.start.date;
          const endTime = e.end.dateTime || e.end.date;
          const start = startTime ? new Date(startTime).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric', 
            minute: 'numeric'
          }) : 'unknown time';
          const end = endTime ? new Date(endTime).toLocaleTimeString('en-US', {
            hour: 'numeric', 
            minute: 'numeric'
          }) : '';
          
          return `ID: ${e.id}
Title: ${e.summary}
When: ${start}${end ? ` to ${end}` : ''}
${e.location ? `Location: ${e.location}\n` : ''}`;
        })
        .join('\n\n')
    : 'You have no upcoming events.';

  return `
You are an expert calendar assistant tasked with identifying events to delete from a user's calendar.

IMPORTANT CONTEXT:
- Today is ${today} (${dayOfWeek})
- The user wants to delete a calendar event

USER'S CALENDAR EVENTS:
${listText}

TASK:
Analyze the user's message and determine with high confidence which specific event they want to delete.

MATCHING CRITERIA (in order of priority):
1. Exact title match
2. Partial title match combined with date/time references
3. Date/time reference that uniquely identifies an event
4. Location matches combined with other context clues
5. Description matches combined with other context clues

INSTRUCTIONS:
1. Carefully analyze which event the user is referring to
2. If multiple events could match, prioritize:
   - Events occurring sooner
   - Events with titles that more closely match the user's description
3. If you cannot confidently identify a specific event, return "None" for eventId
4. Return a JSON object with:
   - eventId: string (ID of event to delete, "None" if no clear match)

USER'S MESSAGE: "${userInput}"

Return ONLY a valid JSON object with the eventId field. No explanations or additional text.
  `;
}

function createFollowUpPrompt(missingInfo, partialEventData) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  const now = new Date();
  const currentHour = now.getHours();
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
  
  // Convert partial event data to a readable format for context
  let partialEventContext = '';
  if (partialEventData) {
    partialEventContext = `
Based on what you've told me so far, I have:
${partialEventData.title ? `- Title: ${partialEventData.title}` : ''}
${partialEventData.location ? `- Location: ${partialEventData.location}` : ''}
${partialEventData.start ? `- Start: ${new Date(partialEventData.start).toLocaleString()}` : ''}
${partialEventData.end ? `- End: ${new Date(partialEventData.end).toLocaleString()}` : ''}
`;
  }
  
  return `
You are an expert calendar assistant that helps users schedule events by asking for missing information.

IMPORTANT CONTEXT:
- Today is ${today} (${dayOfWeek})
- Current time is approximately ${currentHour}:00
${partialEventContext}

TASK:
The user is trying to create a calendar event but hasn't provided all the necessary information.
${missingInfo === 'date' ? 'They haven\'t specified WHEN the event should occur (which date).' : ''}
${missingInfo === 'time' ? 'They haven\'t specified WHAT TIME the event should occur.' : ''}
${missingInfo === 'duration' ? 'They haven\'t specified HOW LONG the event will last.' : ''}
${missingInfo === 'title' ? 'They haven\'t provided a clear TITLE for the event.' : ''}
${missingInfo === 'location' ? 'They haven\'t specified WHERE the event will take place.' : ''}

Formulate a natural, conversational question to ask the user for this specific missing information.
Be friendly but direct, and make your question specific to the event they're trying to create.

Your response should be ONLY the question asking for the missing information. No other text, no JSON.
`;
}

module.exports = { createPrompt, updatePrompt, deletePrompt, createFollowUpPrompt };