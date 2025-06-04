const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function classifyIntent(userMessage) {
  const prompt = `
    You are an assistant that classifies user messages into one of the following intents for a calendar application:
    - create: user wants to add/create a new event.
    - list: user wants to see existing events or calendar info.
    - update: user wants to modify an existing event. This includes changing the time, title, or any details of an existing event.
    - delete: user wants to remove an event.
    - unclear: user's message is unclear, random, or not related to calendar scheduling.

    Examples of unclear messages:
    - Random text like "asdf" or "hello world"
    - General greetings with no calendar context like "hi there" or "how are you"
    - Questions unrelated to calendar like "what's the weather"
    - Messages that don't have a clear calendar-related intent

    User Message: "${userMessage}"

    Respond with only one word: create, list, update, delete, or unclear.
      `;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
  });

  const intent = completion.choices[0].message.content.trim().toLowerCase();
  if (['create', 'list', 'update', 'delete', 'unclear'].includes(intent)) {
    return intent;
  }
  
  // If the model returns something unexpected, consider it unclear
  return 'unclear';
}

module.exports = { classifyIntent };
