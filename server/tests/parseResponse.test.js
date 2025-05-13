const { parseGPTResponse } = require('../services/nlp/parseResponse');

describe('parseGPTResponse', () => {
  test('correctly parses valid GPT JSON output', () => {
    const gptOutput = `
      Sure! Here's the event:

      {
        "title": "Math 124 Lecture",
        "start": "2025-05-08T10:00",
        "end": "2025-05-08T11:00",
        "location": "SAV 132",
        "description": "Weekly lecture"
      }
    `;

    const result = parseGPTResponse(gptOutput);
    expect(result.title).toBe('Math 124 Lecture');
    expect(result.start).toBe('2025-05-08T10:00');
    expect(result.end).toBe('2025-05-08T11:00');
    expect(result.location).toBe('SAV 132');
    expect(result.description).toBe('Weekly lecture');
  });

  test('throws an error for invalid JSON', () => {
    const malformedOutput = `This is not JSON at all!`;
    expect(() => parseGPTResponse(malformedOutput)).toThrow('Invalid GPT response format');
  });

  test('throws an error if required fields are missing', () => {
    const incompleteOutput = `
      {
        "title": "Incomplete Event"
      }
    `;
    expect(() => parseGPTResponse(incompleteOutput)).toThrow('Missing required event fields');
  });
});
