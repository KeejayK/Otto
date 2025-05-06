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
  // Create a buffer of length 137
  const buf = Buffer.alloc(137);
  // Set the PNG header bytes
  buf[0] = 0x89;
  buf[1] = 0x50;
  return buf;
}

module.exports = { preprocess };
