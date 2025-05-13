const request = require('supertest');
const app = require('../app');
const axios = require('axios');
const { OpenAI } = require('openai');

jest.mock('axios');
jest.mock('openai');

describe('POST /api/chat', () => {
  beforeEach(() => {
    OpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: `
                {
                  "title": "Test Event",
                  "start": "2025-05-13T10:00",
                  "end": "2025-05-13T11:00",
                  "location": "Room 101",
                  "description": "Unit test event"
                }
              `,
                },
              },
            ],
          }),
        },
      },
    }));

    axios.post.mockResolvedValue({
      data: 'Event created: https://calendar.google.com/event123',
    });
  });

  it('processes a message and returns a calendar event confirmation', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'Add test event on May 13 from 10 to 11' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('Event created');
  });
});
