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
      delete: jest.fn().mockResolvedValue({}),
      list: jest.fn().mockResolvedValue({
        data: {
          items: [
            {
              id: '1',
              summary: 'Event 1',
              start: { dateTime: '2023-03-01T10:00:00Z' },
              end: { dateTime: '2023-03-01T11:00:00Z' },
            },
            {
              id: '2',
              summary: 'Event 2',
              start: { dateTime: '2023-03-15T12:00:00Z' },
              end: { dateTime: '2023-03-15T13:00:00Z' },
            },
          ],
        },
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

describe('Calendar API', () => {
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

  it('should delete a calendar event', async () => {
    const eventId = '1';

    const response = await request(app).delete(
      `/api/calendar/delete-event/${eventId}`,
    );

    expect(response.status).toBe(200);
    expect(response.text).toContain(
      `Event with ID ${eventId} deleted successfully.`,
    );
  });

  it('should get all calendar events for a specific month', async () => {
    const year = 2023;
    const month = 3; // March

    const response = await request(app).get(
      `/api/calendar/events/${year}/${month}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: '1',
        summary: 'Event 1',
        start: { dateTime: '2023-03-01T10:00:00Z' },
        end: { dateTime: '2023-03-01T11:00:00Z' },
      },
      {
        id: '2',
        summary: 'Event 2',
        start: { dateTime: '2023-03-15T12:00:00Z' },
        end: { dateTime: '2023-03-15T13:00:00Z' },
      },
    ]);
  });
});
