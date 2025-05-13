const { buildPrompt } = require('../services/nlp/gptPromptManager');

describe('buildPrompt', () => {
  it('includes the user message in the prompt', () => {
    const input = 'Add ECON 200 lecture on MWF from 10 to 11';
    const prompt = buildPrompt(input);
    expect(prompt).toContain(input);
  });

  it('includes expected JSON keys', () => {
    const prompt = buildPrompt('Create event');
    expect(prompt).toContain('"title"');
    expect(prompt).toContain('"start"');
    expect(prompt).toContain('"end"');
    expect(prompt).toContain('Respond only with a valid JSON object');
  });
});
