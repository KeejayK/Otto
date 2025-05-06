// server/tests/syllabus.test.js
const request = require('supertest');
const app = require('../app');
const path = require('path');

describe('POST /api/syllabus', () => {
  it('returns OCR text from uploaded image', async () => {
    const res = await request(app)
      .post('/api/syllabus')
      .attach('file', path.join(__dirname, 'fixtures', 'hello.png'));

    expect(res.statusCode).toBe(200);
    expect(res.body.text.toUpperCase()).toContain('HELLO');
  });
});
