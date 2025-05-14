// server/tests/syllabus.test.js
const request = require('supertest');
const createApp = require('../app');
const path = require('path');
const { initializeWorker, terminateWorker } = require('../services/ocr/engine');

// Prevent Firebase from initializing during this test
jest.mock('../firebase.js', () => ({}));

// Only include the syllabus route for testing
const app = createApp({ includeAuth: false, includeCalendar: false, includeSyllabus: true });

describe('PDF Syllabus Extraction', () => {
  beforeAll(async () => {
    await initializeWorker();
  });

  afterAll(async () => {
    await terminateWorker();
  });

  it('extracts text from a digital syllabus PDF', async () => {
    const res = await request(app)
      .post('/api/syllabus')
      .attach('file', path.join(__dirname, 'fixtures', 'hello.pdf'));

    console.log('Extracted text:', res.body.text);
    expect(res.statusCode).toBe(200);
    expect(res.body.text.toUpperCase()).toContain('HELLO');
  });
});
