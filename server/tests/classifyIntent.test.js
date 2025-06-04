jest.mock('openai', () => {
  const createMock = jest.fn();
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: createMock
        }
      }
    })),
    __createMock: createMock // expose for beforeEach
  };
});

const { OpenAI, __createMock } = require('openai');

describe('classifyIntent', () => {
  let classifyIntent;

  beforeEach(() => {

    // Set the implementation for the create mock
    __createMock.mockImplementation(async ({ messages }) => {
      const prompt = messages[0].content;
      const userMessageMatch = prompt.match(/Message:\s*"([^"]+)"/m);
      const userMessage = userMessageMatch ? userMessageMatch[1].toLowerCase() : '';

      if (userMessage.includes('add') || userMessage.includes('create')) {
        return { choices: [{ message: { content: 'create' } }] };
      }
      if (userMessage.includes('list') || userMessage.includes('show')) {
        return { choices: [{ message: { content: 'list' } }] };
      }
      if (userMessage.includes('update') || userMessage.includes('change')) {
        return { choices: [{ message: { content: 'update' } }] };
      }
      if (userMessage.includes('delete') || userMessage.includes('remove')) {
        return { choices: [{ message: { content: 'delete' } }] };
      }
      return { choices: [{ message: { content: 'unclear' } }] };
    });

    classifyIntent = require('../services/nlp/classifyIntent').classifyIntent;
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

  it('returns "unclear" for unrelated or unclear messages', async () => {
    const result = await classifyIntent('hello world');
    expect(result).toBe('unclear');
  });
});
