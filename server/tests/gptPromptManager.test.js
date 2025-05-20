const { buildPrompt } = require('../services/nlp/gptPromptManager');

describe('buildPrompt', () => {
  it('includes the user message in the prompt', () => {
    const input = 'Add ECON 200 lecture on MWF from 10 to 11';
    const prompt = buildPrompt(input);
    expect(prompt).toContain(input);
  });

  it('includes expected JSON keys', () => {
    const prompt = buildPrompt('Create event');
    expect(prompt).toContain('- title: string');
    expect(prompt).toContain('- location: string');
    expect(prompt).toContain('- description: string');
    expect(prompt).toContain('- start: string (ISO 8601 format');
    expect(prompt).toContain('- end: string (ISO 8601 format');
    expect(prompt).toContain('Respond only with a valid JSON object');
  });
});
