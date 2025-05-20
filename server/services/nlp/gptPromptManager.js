function buildPrompt(userInput) {
  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Los_Angeles',
  });
  console.log(`today's date is: ${today}`);
  return `
  You are an assistant that extracts event details for a Google Calendar from natural language input.

  Assume that today is ${today}
  
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

module.exports = { buildPrompt };
