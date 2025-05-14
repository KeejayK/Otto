// server/routes/syllabus.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const { loadImage, loadPdfOrImage }  = require('../services/ocr/loader');
const { preprocess } = require('../services/ocr/preprocess');
const { runOCR } = require('../services/ocr/engine');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// POST /api/syllabus
// Accepts a single file upload (image or PDF), runs OCR, and returns raw text
router.post('/', upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const uploadedPath = path.resolve(req.file.path);
  const fileBuffer = await fs.readFile(uploadedPath);
  console.log('Uploaded file path:', uploadedPath);
  console.log('Uploaded file size:', fileBuffer.length);
  console.log('First 16 bytes:', fileBuffer.slice(0, 16));

  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(fileBuffer);
    console.log('pdf-parse data:', data);

    let resultText = '';
    if (data.text && data.text.trim().length > 0) {
      resultText = data.text;
      console.log('Returning direct extracted text:', resultText);
    } else {
      // fallback to OCR if needed
      const { buffer: image } = await loadPdfOrImage(uploadedPath);
      if (image) {
        const cleanImage = await preprocess(image);
        const ocrResult = await runOCR(cleanImage);
        resultText = ocrResult.text || ocrResult;
        console.log('Returning OCR fallback text:', resultText);
      } else {
        resultText = '[ERROR: Could not extract text from PDF]';
        console.log('Returning error text:', resultText);
      }
    }

    await fs.unlink(uploadedPath);
    return res.json({ text: resultText });
  } catch (err) {
    // Clean up on error, then forward
    await fs.unlink(uploadedPath).catch(() => {});
    return next(err);
  }
});

module.exports = router;
