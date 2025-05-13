const Tesseract = require('tesseract.js');
let worker = null;

async function initializeWorker() {
  console.log('Initializing worker...');
  if (worker) {
    console.log('Worker already initialized');
    return worker;
  }

  try {
    // Create worker with current API
    worker = await Tesseract.createWorker('eng');

    // Set a timeout for initialization
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Worker initialization timeout')), 25000)
    );

    // Race between initialization and timeout
    await Promise.race([
      (async () => {
        // No need to call load() or loadLanguage() anymore
        // Worker is initialized with language in createWorker()
        console.log('Worker initialized');
      })(),
      timeout
    ]);

    return worker;
  } catch (error) {
    console.error('Error initializing worker:', error);
    worker = null;
    throw error;
  }
}

async function terminateWorker() {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}

// Modified runOCR to return text and metadata
async function runOCR(imageBuffer) {
  if (!worker) {
    console.error('Worker is not initialized.');
    return { text: '', metadata: null }; // Return empty result if not initialized
  }
  try {
    const { data } = await worker.recognize(imageBuffer);
    // Return both text and metadata (words, lines, blocks)
    return {
      text: data.text,
      metadata: {
        words: data.words,
        lines: data.lines,
        blocks: data.blocks,
        confidence: data.confidence
      }
    };
  } catch (error) {
    console.error('Error during OCR:', error);
    return { text: '', metadata: null }; // Return empty result on error
  }
}

module.exports = { initializeWorker, terminateWorker, runOCR, getWorker: () => worker };
