function parseGPTResponse(gptOutput) {
  try {
    // Find where the JSON starts/ends in GPT output
    const jsonStart = gptOutput.indexOf('{');
    const jsonEnd = gptOutput.lastIndexOf('}') + 1;
    const jsonString = gptOutput.slice(jsonStart, jsonEnd);

    const eventData = JSON.parse(jsonString);

    // must have title, start, end
    const { title, start, end } = eventData;
    if (!title || !start || !end) {
      throw new Error('Missing required event fields.');
    }

    // optional
    eventData.description = eventData.description || '';
    eventData.location = eventData.location || '';

    return eventData;
  } catch (err) {
    console.error('Failed to parse GPT response:', err.message);
    console.error('Raw GPT output was:', gptOutput);
    throw new Error('Invalid GPT response format');
  }
}

module.exports = { parseGPTResponse };
