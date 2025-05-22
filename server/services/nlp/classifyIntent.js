const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function classifyIntent(userMessage) {
  const prompt = `
    You are an assistant that classifies user messages into one of the following intents for a calendar application:
    - create: user wants to add/create a new event.
    - list: user wants to see existing events or calendar info.
    - update: user wants to modify an existing event.
    - delete: user wants to remove an event.

    Message: "${userMessage}"

    Respond with only one word: create, list, update, or delete.
      `;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
  });

  const intent = completion.choices[0].message.content.trim().toLowerCase();
  if (['create', 'list', 'update', 'delete'].includes(intent)) {
    return intent;
  }
  return 'list';
}

module.exports = { classifyIntent };
