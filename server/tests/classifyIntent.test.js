// Mock the OpenAI module to control its behavior
jest.mock('openai', () => ({
  OpenAI: jest.fn()
}));

const { OpenAI } = require('openai');

describe.skip('classifyIntent', () => {
  let classifyIntent;

  beforeEach(() => {
    jest.resetModules();

    OpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(({ messages }) => {
            const prompt = messages[0].content.toLowerCase();

            if (prompt.includes('when is my next exam') || prompt.includes('what')) {
              return Promise.resolve({ choices: [{ message: { content: 'query' } }] });
            }
            if (prompt.includes('add') || prompt.includes('create')) {
              return Promise.resolve({ choices: [{ message: { content: 'create' } }] });
            }
            if (prompt.includes('list') || prompt.includes('show')) {
              return Promise.resolve({ choices: [{ message: { content: 'list' } }] });
            }
            if (prompt.includes('update') || prompt.includes('change')) {
              return Promise.resolve({ choices: [{ message: { content: 'update' } }] });
            }
            if (prompt.includes('delete') || prompt.includes('remove')) {
              return Promise.resolve({ choices: [{ message: { content: 'delete' } }] });
            }
            // Default fallback
            return Promise.resolve({ choices: [{ message: { content: 'query' } }] });
          })
        }
      }
    }));

    classifyIntent = require('../services/nlp/classifyIntent').classifyIntent;
  });

  it('returns "query" for informational questions', async () => {
    const result = await classifyIntent('When is my next exam?');
    expect(result).toBe('query');
  });

  it('returns "create" for requests to add an event', async () => {
    const result = await classifyIntent('Add CS lecture tomorrow at 10am');
    expect(result).toBe('create');
  });

  it('returns "list" for requests to list events', async () => {
    const result = await classifyIntent('List all my meetings for next week');
    expect(result).toBe('list');
  });

  it('returns "update" for requests to modify an event', async () => {
    const result = await classifyIntent('Update my dentist appointment to 3pm');
    expect(result).toBe('update');
  });

  it('returns "delete" for requests to remove an event', async () => {
    const result = await classifyIntent('Delete my gym session on Friday');
    expect(result).toBe('delete');
  });

  it('defaults to "query" if the model returns something unexpected', async () => {
    // Manually mock the completion to something invalid
    OpenAI.mockImplementationOnce(() => ({
      chat: {
        completions: {
          create: () => Promise.resolve({ choices: [{ message: { content: 'foobar' } }] })
        }
      }
    }));
    const fallback = await classifyIntent('This will fallback');
    expect(fallback).toBe('query');
  });
});
