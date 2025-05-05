const request = require('supertest');
const app = require('../app');
const { google } = require('googleapis');

// Mock the Google Calendar API
jest.mock('googleapis', () => {
  const mCalendar = {
    events: {
      insert: jest.fn().mockResolvedValue({
        data: { htmlLink: 'http://example.com/event' },
      }),
    },
  };
  return {
    google: {
      calendar: jest.fn(() => mCalendar),
      auth: {
        OAuth2: jest.fn().mockImplementation(() => ({
          setCredentials: jest.fn(),
        })),
      },
    },
  };
});

describe('POST /api/calendar/add-event', () => {
  it('should create a new calendar event', async () => {
    const eventData = {
      summary: 'Test Event',
      location: 'Test Location',
      description: 'Test Description',
      start: '2023-10-10T10:00:00Z',
      end: '2023-10-10T11:00:00Z',
    };

    const response = await request(app)
      .post('/api/calendar/add-event')
      .send(eventData);

    expect(response.status).toBe(200);
    expect(response.text).toContain('Event created: http://example.com/event');
  });
});