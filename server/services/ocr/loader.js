// server/services/ocr/loader.js
const fs = require('fs').promises;
const path = require('path');
const { fromPath } = require('pdf2pic');
const pdfParse = require('pdf-parse');

async function loadImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') {
    // Convert first page of PDF into PNG buffer
    const converter = fromPath(filePath, {
      density: 300,
      format: 'png',
      width: 1200,
    });
    const [page] = await converter(1);
    return Buffer.from(page.base64, 'base64');
  }
  // Otherwise assume image file
  return fs.readFile(filePath);
}

// New function: Try direct PDF text extraction, else fall back to image buffer
async function loadPdfOrImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') {
    // Try direct text extraction
    const data = await pdfParse(await fs.readFile(filePath));
    if (data.text && data.text.trim().length > 0) {
      return { text: data.text, buffer: null };
    }
    // Fallback: Convert first page to image buffer
    const converter = fromPath(filePath, { density: 300, format: 'png', width: 1200 });
    const [page] = await converter(1);
    return { text: null, buffer: Buffer.from(page.base64, 'base64') };
  }
  // Otherwise assume image file
  return { text: null, buffer: await fs.readFile(filePath) };
}

module.exports = { loadImage, loadPdfOrImage };
