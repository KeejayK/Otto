const { classifyIntent } = require('../services/nlp/classifyIntent');
const { OpenAI } = require('openai');

jest.mock('openai');

describe('classifyIntent', () => {
  beforeEach(() => {
    OpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(({ messages }) => {
            const userInput = messages[0].content;
            if (userInput.includes('When is my next exam')) {
              return Promise.resolve({
                choices: [{ message: { content: 'query' } }],
              });
            } else {
              return Promise.resolve({
                choices: [{ message: { content: 'event' } }],
              });
            }
          }),
        },
      },
    }));
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
