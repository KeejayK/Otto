// server/routes/syllabus.js

const express    = require('express');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs').promises;


const { loadImage }  = require('../services/ocr/loader');
const { preprocess } = require('../services/ocr/preprocess');
const { runOCR }     = require('../services/ocr/engine');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// POST /api/syllabus
// Accepts a single file upload (image or PDF), runs OCR, and returns raw text
router.post('/', upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const uploadedPath = path.resolve(req.file.path);

  try {
    // 1. Load (PDF first page or image) into a buffer or image object
    const image = await loadImage(uploadedPath);

    // 2. Pre‑process (grayscale, scale, binarize…)
    const cleanImage = await preprocess(image);

    // 3. Run the OCR engine to get raw text
    const rawText = await runOCR(cleanImage);

    // 4. Clean up the upload temp file
    await fs.unlink(uploadedPath);

    // 5. Return the text
    return res.json({ text: rawText });
  } catch (err) {
    // Clean up on error, then forward
    await fs.unlink(uploadedPath).catch(() => {});
    return next(err);
  }
});

module.exports = router;

