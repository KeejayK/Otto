function buildPrompt(userInput) {
  return `
  You are an assistant that extracts event details for a Google Calendar from natural language input.
  
  Given the message below, return a JSON object with the following fields:
  - title: string
  - location: string
  - description: string (optional)
  - start: string (ISO 8601 format, e.g., "2025-05-06T10:00")
  - end: string (ISO 8601 format)
  
  Message: "${userInput}"
  
  Respond only with a valid JSON object.
  `;
}

module.exports = { buildPrompt };
