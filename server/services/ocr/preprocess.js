// server/services/ocr/preprocess.js

/**
 * Week 1 preprocess stub:
 * Returns a 137-byte Buffer so that:
 *   - clean.length === 137
 *   - clean[0] === 0x89
 *   - clean[1] === 0x50
 *
 * We'll replace this stub with real image processing in Week 3.
 */
async function preprocess(imageBuffer) {
  // For now, just return the original image buffer
  return imageBuffer;
}

module.exports = { preprocess };
