function parseGPTResponse(gptOutput) {
    try {
      // Find where the JSON starts/ends in GPT output
      const jsonStart = gptOutput.indexOf('{');
      const jsonEnd = gptOutput.lastIndexOf('}') + 1;
      const jsonString = gptOutput.slice(jsonStart, jsonEnd);
  
      const eventData = JSON.parse(jsonString);
  
      // Optionally: basic validation
      if (!eventData.title || !eventData.start || !eventData.end) {
        throw new Error('Missing required event fields.');
      }
  
      return eventData;
    } catch (err) {
      console.error('Failed to parse GPT response:', err.message);
      throw new Error('Invalid GPT response format');
    }
  }
  
  module.exports = { parseGPTResponse };
  