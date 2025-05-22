function createPrompt(userInput) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  console.log(`today's date is: ${today}`);
  return `
  You are an assistant that extracts event details for a Google Calendar from natural language input.

  Assume today is ${today}
  
  Given the message below, return a JSON object with the following fields:
  - title: string
  - location: string
  - description: string (optional)
  - start: string (ISO 8601 format, e.g., "2025-05-06T10:00")
  - end: string (ISO 8601 format)

  If there is only one start time, you should estimate a reasonable duration based on the event.
  If an aspect of the message, like am or pm isn't specified, interpret reasonably.
  
  Message: "${userInput}"
  
  Respond only with a valid JSON object.
  `;
}

function updatePrompt(userInput, events) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  const listText = events.length
    ? events
        .map(e => `${e.id}: ${e.summary} from ${e.start} to ${e.end}`)
        .join('\n')
    : 'You have no upcoming events.';

  console.log(`Events to be considered: ${listText}`)

  return `
  You are an assistant that helps modify existing Google Calendar events.
  Assume today is ${today}.

  Here are the next ${events.length} events:
  ${listText}

  Given the message below, identity which (if any) event to update and output a JSON object representing the updated event with these properties:
  - eventId: string
  - title: string
  - location: string
  - description: string
  - start: string (ISO 8601 datetime)
  - end: string (ISO 8601 datetime)

  Message: "${userInput}"

  If the event the message references doesn't appear to exist, please return None for eventId.

  Respond only with a valid JSON object.`;
}

function deletePrompt(userInput, events) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  const listText = events.length
    ? events
        .map(e => `${e.id}: ${e.summary} from ${e.start} to ${e.end}`)
        .join('\n')
    : 'You have no upcoming events.';

  console.log(`Events to be considered: ${listText}`)


  return `
  You are an assistant that helps delete Google Calendar events.
  Assume today is ${today}.

  Here are the next ${events.length} events:
  ${listText}

  Given the message below, identify the event (if any) to remove and return a JSON object with:
  - eventId: string

  Message: "${userInput}"

  If the event the message references doesn't appear to exist, please return "None" for eventId.

  Respond only with a valid JSON object.`;
}

module.exports = { createPrompt, updatePrompt, deletePrompt };
