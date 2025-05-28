function createPrompt(userInput) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  const now = new Date();
  const currentHour = now.getHours();
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
  
  return `
You are an expert assistant that extracts calendar event details from natural language input.

IMPORTANT CONTEXT:
- Today is ${today} (${dayOfWeek})
- Current time is approximately ${currentHour}:00
- The user wants to create a calendar event

Parse the following message and return a JSON object with these fields:
- title: string (clear, concise name for the event)
- location: string (where the event takes place, empty if not specified)
- description: string (additional notes about the event, empty if not specified)
- start: string (ISO 8601 format, e.g., "2025-05-06T10:00")
- end: string (ISO 8601 format)

INTERPRETATION RULES:
1. For missing times:
   - If just "morning" is mentioned: assume 9:00 AM
   - If just "afternoon" is mentioned: assume 2:00 PM
   - If just "evening" is mentioned: assume 6:00 PM
   - If no specific time: assume 9:00 AM for morning events, 2:00 PM otherwise

2. For durations:
   - Meetings/calls: 30-60 minutes (default: 30 min)
   - Classes/lectures: 50-90 minutes (default: 75 min)
   - Lunches/coffees: 60 minutes
   - Dinners: 90 minutes
   - Appointments: 60 minutes
   - Conferences/workshops: full day (9 AM - 5 PM)
   
3. For relative dates:
   - "Today" refers to current date
   - "Tomorrow" refers to next day
   - "Next [day]" refers to the next occurrence of that weekday
   - Day names refer to the upcoming occurrence of that day

4. For recurring events mentions:
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
You are an expert calendar assistant tasked with identifying and updating existing calendar events.

IMPORTANT CONTEXT:
- Today is ${today} (${dayOfWeek})
- The user wants to modify an existing event

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
   - start: string (new start time in ISO 8601 format if changing, empty string if not changing)
   - end: string (new end time in ISO 8601 format if changing, empty string if not changing)

4. For date/time modifications:
   - Convert all times to ISO 8601 format with timezone
   - Be precise with dates, inferring current month/year for relative references
   - For partial updates (e.g., just changing the time), preserve the original date

USER'S MESSAGE: "${userInput}"

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

module.exports = { createPrompt, updatePrompt, deletePrompt };