const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function classifyIntent(userMessage) {
  const prompt = `
You are a classification assistant.

Determine whether the following message is an "event" (the user wants to add something to their calendar) or a "query" (they want to ask about existing calendar info).

Message: "${userMessage}"

Respond with only one word: "event" or "query"
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
  });

  const result = completion.choices[0].message.content.trim().toLowerCase();
  return result === 'query' ? 'query' : 'event'; // default to 'event'
}

module.exports = { classifyIntent };
