// server/services/ocr/loader.js
const fs = require('fs').promises;
const path = require('path');
const { fromPath } = require('pdf2pic');

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

module.exports = { loadImage };
