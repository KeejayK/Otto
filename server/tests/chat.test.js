const request = require('supertest');
const axios = require('axios');
const { OpenAI } = require('openai');

jest.mock('axios');
jest.mock('openai');

// Create a mock for the OpenAI instance
const mockOpenAIInstance = {
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
              role: 'assistant'
            },
          },
        ],
      })
    }
  }
};

// Configure the mock before requiring the app
OpenAI.mockImplementation(() => mockOpenAIInstance);

// We need to require app after setting up the OpenAI mock
// to ensure our mock is used when app initializes
const app = require('../app');

// Mock all dependencies used in routes/chat.js
jest.mock('../services/nlp/classifyIntent', () => ({
  classifyIntent: jest.fn().mockResolvedValue('mockedIntent'),
}));

jest.mock('../services/nlp/gptPromptManager', () => ({
  createPrompt: jest.fn().mockReturnValue('mockedPrompt'),
  updatePrompt: jest.fn().mockReturnValue('mockedUpdatePrompt'),
  deletePrompt: jest.fn().mockReturnValue('mockedDeletePrompt'),
  createFollowUpPrompt: jest.fn().mockReturnValue('mockedFollowUpPrompt'),
}));

jest.mock('../services/nlp/parseResponse', () => ({
  parseGPTResponse: jest.fn().mockReturnValue({
    title: 'Test Event',
    start: '2025-05-13T10:00',
    end: '2025-05-13T11:00',
    location: 'Room 101',
    description: 'Unit test event'
  }),
}));

jest.mock('../services/nlp/timeHelper', () => ({
  formatDate: jest.fn().mockReturnValue('May 13, 2025'),
  parseTimeAndApplyToDate: jest.fn().mockReturnValue(new Date('2025-05-13T10:00:00.000Z')),
  toISOString: jest.fn().mockReturnValue('2025-05-13T10:00:00.000Z'),
}));

jest.mock('../middleware/auth', () => jest.fn((req, res, next) => next()));

describe('POST /api/chat', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock axios for calendar event creation
    axios.post.mockResolvedValue({
      data: 'Event created: https://calendar.google.com/event123',
    });
  });

  it('processes a message and returns a calendar event confirmation', async () => {
    // Step 1: Send the initial request to create an event
    const initialRes = await request(app)
      .post('/api/chat')
      .send({ message: 'Add test event on May 13 from 10 to 11' });

    expect(initialRes.statusCode).toBe(200);
    expect(initialRes.body.message).toContain('Confirm');
    expect(initialRes.body.message).toContain('Test Event');
    
    // Step 2: Send the confirmation
    const confirmRes = await request(app)
      .post('/api/chat')
      .send({ message: 'yes' });

    expect(confirmRes.statusCode).toBe(200);
    expect(confirmRes.body.message).toEqual('Event added to your calendar!');
  });
});
