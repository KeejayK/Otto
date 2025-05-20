// Mock the OpenAI module to control its behavior
jest.mock('openai', () => ({
  OpenAI: jest.fn()
}));

// Import the mocked OpenAI constructor
const { OpenAI } = require('openai');

describe.skip('classifyIntent', () => {
  let classifyIntent;

  beforeEach(() => {
    // Reset modules to re-import with mocks applied
    jest.resetModules();

    // Provide a mock implementation for the OpenAI constructor
    OpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(({ messages }) => {
            const userInput = messages[0].content;
            if (userInput.includes('When is my next exam')) {
              return Promise.resolve({ choices: [{ message: { content: 'query' } }] });
            }
            return Promise.resolve({ choices: [{ message: { content: 'event' } }] });
          })
        }
      }
    }));

    // Now import classifyIntent after setting up the OpenAI mock
    classifyIntent = require('../services/nlp/classifyIntent').classifyIntent;
  });

  it('returns "query" for questions about existing events', async () => {
    const result = await classifyIntent('When is my next exam?');
    expect(result).toBe('query');
  });

  it('returns "event" for requests to add an event', async () => {
    const result = await classifyIntent('Add CS lecture tomorrow at 10am');
    expect(result).toBe('event');
  });
});
