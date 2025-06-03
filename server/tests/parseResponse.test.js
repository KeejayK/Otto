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

  test('throws detailed error for invalid JSON', () => {
    const malformedOutput = `This is not JSON at all!`;
    expect(() => parseGPTResponse(malformedOutput)).toThrow(
      'Parsing error: No JSON object found in the GPT output.'
    );
  });

  test('throws detailed error if required fields are missing', () => {
    const incompleteOutput = `
      {
        "title": "Incomplete Event"
      }
    `;
    expect(() => parseGPTResponse(incompleteOutput)).toThrow(
      'Parsing error: Missing required event fields: title, start, or end.'
    );
  });
  
  test('throws detailed error when no JSON is present in GPT response', () => {
    const noJsonOutput = `This is a plain text response without any JSON.`;
    expect(() => parseGPTResponse(noJsonOutput)).toThrow(
      'Parsing error: No JSON object found in the GPT output.'
    );
  });

  test('throws detailed error for JSON without required fields', () => {
    const noFieldsOutput = `{}`;
    expect(() => parseGPTResponse(noFieldsOutput)).toThrow(
      'Parsing error: Missing required event fields: title, start, or end.'
    );
  });

  test('defaults optional fields when missing', () => {
    const gptOutput = `
      {
        "title": "Event Without Optional Fields",
        "start": "2025-06-01T09:00",
        "end": "2025-06-01T10:00"
      }
    `;
    const result = parseGPTResponse(gptOutput);
    expect(result.title).toBe('Event Without Optional Fields');
    expect(result.start).toBe('2025-06-01T09:00');
    expect(result.end).toBe('2025-06-01T10:00');
    expect(result.location).toBe('');
    expect(result.description).toBe('');
  });
});
