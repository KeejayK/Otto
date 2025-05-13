const { initializeWorker, terminateWorker } = require('../services/ocr/engine');
const path = require('path');
const fs = require('fs');

// Increase timeout for worker initialization
jest.setTimeout(60000);

describe('PDF Syllabus Extraction', () => {
  beforeAll(async () => {
    try {
      await initializeWorker();
    } catch (error) {
      console.error('Failed to initialize worker:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await terminateWorker();
  });

  it('should extract text from hello.pdf', async () => {
    const pdfPath = path.join(__dirname, 'fixtures', 'hello.pdf');
    if (!fs.existsSync(pdfPath)) {
      console.warn('Skipping test: hello.pdf not found');
      return;
    }
    const pdfBuffer = fs.readFileSync(pdfPath);
    // Direct extraction only, no image/OCR fallback
    const { loadPdfOrImage } = require('../services/ocr/loader');
    const { text } = await loadPdfOrImage(pdfPath);
    console.log('Extracted text (pdf):', text);
    expect(text.toUpperCase()).toContain('HELLO');
  });
});
