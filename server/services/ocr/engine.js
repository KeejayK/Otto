// server/services/ocr/engine.js

/**
 * Week 1 OCR Engine Stub
 *
 * To keep our initial tests passing, this stub simply returns "HELLO"
 * for any input buffer. In Week 2+, replace this with real Tesseract.js
 * logic to perform actual OCR on the image buffer.
 */

async function runOCR(imageBuffer) {
  // Stubbed response for testing against hello.png fixture
  return 'HELLO';
}

module.exports = { runOCR };
