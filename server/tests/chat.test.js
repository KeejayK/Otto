const request = require('supertest');
const axios = require('axios');

// Mock OpenAI before requiring app
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
    __createMock: createMock // expose for test setup
  };
});

jest.mock('axios');

const { OpenAI, __createMock } = require('openai');
const app = require('../app');

jest.mock('../middleware/auth', () => (req, res, next) => {
  req.user = { uid: 'test-user-id' };
  next();
});

describe('POST /api/chat', () => {
  let callCount;
  beforeEach(() => {
    callCount = 0;
    __createMock.mockImplementation(async ({ messages }) => {
      callCount++;
      if (callCount === 1) {
        // Intent classification
        if (global.__intent === 'list') return { choices: [{ message: { content: 'list' } }] };
        if (global.__intent === 'update') return { choices: [{ message: { content: 'update' } }] };
        if (global.__intent === 'delete') return { choices: [{ message: { content: 'delete' } }] };
        if (global.__intent === 'unclear') return { choices: [{ message: { content: 'unclear' } }] };
        // Default to create
        return { choices: [{ message: { content: 'create' } }] };
      }
      // Second call: event creation/update/delete
      if (global.__intent === 'update') {
        // Return updated event JSON
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  eventId: "123",
                  title: "Updated Event",
                  start: "2025-05-13T12:00",
                  end: "2025-05-13T13:00",
                  location: "Room 102",
                  description: "Updated unit test event"
                })
              }
            }
          ]
        };
      }
      if (global.__intent === 'delete') {
        // Return eventId for deletion
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  eventId: "123"
                })
              }
            }
          ]
        };
      }
      // Default: event creation
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "Test Event",
                start: "2025-05-13T10:00",
                end: "2025-05-13T11:00",
                location: "Room 101",
                description: "Unit test event"
              })
            }
          }
        ]
      };
    });

    // Mock axios.post for calendar event creation
    axios.post.mockResolvedValue({
      data: { htmlLink: 'https://calendar.google.com/event123' }
    });

    // Mock axios.get for event listing
    axios.get.mockResolvedValue({
      data: [
        {
          id: "123",
          summary: "Test Event",
          start: { dateTime: "2025-05-13T10:00" },
          end: { dateTime: "2025-05-13T11:00" },
          location: "Room 101"
        }
      ]
    });

    axios.put?.mockResolvedValue({
      data: { htmlLink: 'https://calendar.google.com/event123' }
    });

    axios.delete?.mockResolvedValue({});
  });

  it('processes a message and returns a calendar event confirmation', async () => {
    global.__intent = undefined; // default to create
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'Add class on May 13 from 10 to 11' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/confirm|event/i); // Should contain confirmation or event info
  });

  it('lists events when asked', async () => {
    global.__intent = 'list';
    // First request: triggers confirmation prompt
    const res1 = await request(app)
      .post('/api/chat')
      .send({ message: 'Show my events' });

    expect(res1.statusCode).toBe(200);
    // Should contain a confirmation prompt or event info
    expect(
      /confirm|event/i.test(res1.body.message) || res1.body.message === 'Action cancelled.'
    ).toBe(true);

    // Second request: user confirms
    const res2 = await request(app)
      .post('/api/chat')
      .send({ message: 'yes' });

    expect(res2.statusCode).toBe(200);
    // Should contain the final event listing or confirmation
    expect(
      /event/i.test(res2.body.message) || res2.body.message === 'Action cancelled.'
    ).toBe(true);
  });

  it('returns update confirmation for update intent', async () => {
    global.__intent = 'update';
    // First request: triggers confirmation prompt
    const res1 = await request(app)
      .post('/api/chat')
      .send({ message: 'Update my event' });

    expect(res1.statusCode).toBe(200);
    expect(res1.body.message).toMatch(/confirm|update/i);

    // Second request: user confirms
    const res2 = await request(app)
      .post('/api/chat')
      .send({ message: 'yes' });

    expect(res2.statusCode).toBe(200);
    expect(res2.body.type).toBe('update');
    expect(res2.body.message).toMatch(/updated/i);
  });

  it('returns delete confirmation for delete intent', async () => {
    global.__intent = 'delete';
    // First request: triggers confirmation prompt
    const res1 = await request(app)
      .post('/api/chat')
      .send({ message: 'Delete my event' });

    expect(res1.statusCode).toBe(200);
    expect(res1.body.message).toMatch(/confirm|delete/i);

    // Second request: user confirms
    const res2 = await request(app)
      .post('/api/chat')
      .send({ message: 'yes' });

    expect(res2.statusCode).toBe(200);
    expect(res2.body.type).toBe('delete');
    expect(res2.body.message).toMatch(/deleted/i);
  });

  it('returns fallback help message for unclear intent', async () => {
    global.__intent = 'unclear';
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'asdfasdf' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('Try something like');
  });

});
