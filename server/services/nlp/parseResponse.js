function parseGPTResponse(gptOutput) {
  try {
    // Find where the JSON starts/ends in GPT output
    const jsonStart = gptOutput.indexOf('{');
    const jsonEnd = gptOutput.lastIndexOf('}') + 1;

    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No JSON object found in the GPT output.');
    }

    const jsonString = gptOutput.slice(jsonStart, jsonEnd);
    const eventData = JSON.parse(jsonString);

    // Required fields validation
    const { title, start, end } = eventData;
    if (!title || !start || !end) {
      throw new Error('Missing required event fields: title, start, or end.');
    }

    // optional
    eventData.description = eventData.description || '';
    eventData.location = eventData.location || '';
    
    // Handle recurrence if it exists
    if (eventData.recurrence) {
      // If it's already an array, keep it as is
      if (Array.isArray(eventData.recurrence)) {
        // Make sure each entry starts with RRULE: if not already
        eventData.recurrence = eventData.recurrence.map(rule => 
          rule.startsWith('RRULE:') ? rule : `RRULE:${rule}`
        );
      } 
      // If it's a string, convert it to an array with a single element
      else if (typeof eventData.recurrence === 'string') {
        const rule = eventData.recurrence.startsWith('RRULE:') 
          ? eventData.recurrence 
          : `RRULE:${eventData.recurrence}`;
        eventData.recurrence = [rule];
      }
    }
    
    // Also check if there are any recurring patterns in the description and extract them
    // This helps with backward compatibility with the previous implementation
    if (eventData.description && !eventData.recurrence) {
      const recurrencePatterns = [
        { regex: /every\s+(day|daily)/i, rule: 'RRULE:FREQ=DAILY' },
        { regex: /every\s+weekday/i, rule: 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' },
        { regex: /every\s+weekend/i, rule: 'RRULE:FREQ=WEEKLY;BYDAY=SA,SU' },
        { regex: /every\s+monday/i, rule: 'RRULE:FREQ=WEEKLY;BYDAY=MO' },
        { regex: /every\s+tuesday/i, rule: 'RRULE:FREQ=WEEKLY;BYDAY=TU' },
        { regex: /every\s+wednesday/i, rule: 'RRULE:FREQ=WEEKLY;BYDAY=WE' },
        { regex: /every\s+thursday/i, rule: 'RRULE:FREQ=WEEKLY;BYDAY=TH' },
        { regex: /every\s+friday/i, rule: 'RRULE:FREQ=WEEKLY;BYDAY=FR' },
        { regex: /every\s+saturday/i, rule: 'RRULE:FREQ=WEEKLY;BYDAY=SA' },
        { regex: /every\s+sunday/i, rule: 'RRULE:FREQ=WEEKLY;BYDAY=SU' },
        { regex: /every\s+week/i, rule: 'RRULE:FREQ=WEEKLY' }
      ];
      
      for (const pattern of recurrencePatterns) {
        if (pattern.regex.test(eventData.description)) {
          eventData.recurrence = [pattern.rule];
          break;
        }
      }
    }

    return eventData;
  } catch (err) {
    console.error('Failed to parse GPT response:', err.message);
    console.error('Raw GPT output was:', gptOutput);
    throw new Error(`Parsing error: ${err.message}`);
  }
}

module.exports = { parseGPTResponse };
