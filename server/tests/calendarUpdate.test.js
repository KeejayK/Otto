const request = require('supertest');
const app = require('../app');
const { google } = require('googleapis');

// Mock the Google Calendar API
jest.mock('googleapis', () => {
  const mCalendar = {
    events: {
      update: jest.fn().mockResolvedValue({
        data: { htmlLink: 'http://example.com/updated-event' },
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

describe('PUT /api/calendar/modify-event/:eventId', () => {
  it('should update an existing calendar event', async () => {
    const eventId = '1';
    const updatedEventData = {
      summary: 'Updated Test Event',
      location: 'Updated Test Location',
      description: 'Updated Test Description',
      start: '2023-10-10T12:00:00Z',
      end: '2023-10-10T13:00:00Z',
    };

    const response = await request(app)
      .put(`/api/calendar/modify-event/${eventId}`)
      .send(updatedEventData);

    expect(response.status).toBe(200);
    expect(response.text).toContain(
      'Event updated: http://example.com/updated-event',
    );
  });
});
