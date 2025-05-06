// server/tests/ocr.test.js
const path = require('path');
const fs = require('fs');
const { loadImage } = require('../services/ocr/loader');
const { preprocess } = require('../services/ocr/preprocess');
const { runOCR } = require('../services/ocr/engine');

describe('OCR Pipeline', () => {
  const sampleImg = path.join(__dirname, 'fixtures', 'hello.png');
  // Place a high‑contrast “HELLO” image at server/tests/fixtures/hello.png

  it('loads an image buffer', async () => {
    const buf = await loadImage(sampleImg);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(0);
  });

  it('preprocess returns a smaller/PNG buffer', async () => {
    const buf = await loadImage(sampleImg);
    const clean = await preprocess(buf);
    expect(Buffer.isBuffer(clean)).toBe(true);
    // PNG headers start with [0x89, 0x50, ...]
    expect(clean[0]).toBe(0x89);
    expect(clean[1]).toBe(0x50);
  });

  it('runOCR recognizes HELLO', async () => {
    const buf = await loadImage(sampleImg);
    const clean = await preprocess(buf);
    const text = await runOCR(clean);
    expect(text.toUpperCase()).toContain('HELLO');
  });
});
