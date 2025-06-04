jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: jest.fn() } }
  }))
}));

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
      list: jest.fn((params) => {
        if (params.calendarId === 'primary') {
          return Promise.resolve({
            data: {
              items: [
                {
                  id: '2',
                  summary: 'Future Event',
                  start: { dateTime: '2025-10-15T12:00:00Z' },
                  end: { dateTime: '2025-10-15T13:00:00Z' },
                },
              ],
            },
          });
        } else {
          return Promise.resolve({
            data: {
              items: [],
            },
          });
        }
      }),
      get: jest.fn().mockResolvedValue({
        data: {
          id: '1',
          summary: 'Event 1',
          start: { dateTime: '2023-03-01T10:00:00Z' },
          end: { dateTime: '2023-03-01T11:00:00Z' },
        },
      }),
      update: jest.fn().mockResolvedValue({
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
          on: jest.fn(),
        })),
      },
    },
  };
});

// Mock the verifyFirebaseToken middleware
jest.mock('../middleware/auth', () =>
  jest.fn((req, res, next) => {
    req.user = { uid: 'test-user-id' };
    next();
  }),
);

// Mock Firestore to return user data with Google credentials
jest.mock('../firebase', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() =>
          Promise.resolve({
            exists: true,
            data: () => ({
              google: {
                accessToken: 'mock-access-token',
                refreshToken: 'mock-refresh-token',
              },
            }),
          }),
        ),
      })),
    })),
  })),
}));

describe('Calendar API', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  beforeAll(() => {
    console.log('Running Calendar API tests');
  });

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
    expect(response.body.htmlLink).toBe('http://example.com/event');
  });

  it('should modify an existing calendar event', async () => {
    const eventId = '1';
    const updatedEventData = {
      summary: 'Updated Test Event',
      location: 'Updated Test Location',
      description: 'Updated Test Description',
      start: '2023-10-11T10:00:00Z',
      end: '2023-10-11T11:00:00Z',
    };

    const response = await request(app)
      .put(`/api/calendar/modify-event`)
      .send({ eventId, ...updatedEventData });

    expect(response.status).toBe(200);
    expect(response.body.htmlLink).toBe('http://example.com/event');
  });

  it('should delete an existing calendar event', async () => {
    const eventId = '1';

    const response = await request(app).delete(
      `/api/calendar/delete-event/${eventId}`,
    );

    expect(response.status).toBe(204);
  });

  it('should list only future calendar events', async () => {
    const response = await request(app).get('/api/calendar/list-events');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].summary).toBe('Future Event');
  });
});
