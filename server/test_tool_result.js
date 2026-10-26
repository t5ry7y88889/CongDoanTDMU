require('dotenv').config();
const { ToolLoopAgent, tool } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { z } = require('zod');

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
const agent = new ToolLoopAgent({
  model: google('gemini-2.5-flash'),
  instructions: 'Khi người dùng yêu cầu sửa ngày tháng, bạn hãy gọi tool find_and_replace với findText là ngày cũ và replaceWith là ngày mới.',
  tools: {
    find_and_replace: tool({
      description: 'Sửa ngày tháng trong bài viết',
      parameters: z.object({ findText: z.string(), replaceWith: z.string() }),
      execute: async ({ findText, replaceWith }) => {
        console.log('--- EXECUTE CALLED with:', findText, replaceWith);
        return { action: 'find_and_replace', findText, replaceWith };
      }
    })
  }
});

async function run() {
  const stream = agent.stream({
    messages: [{ role: 'user', content: 'sửa phần ngày tháng sai 90/6 thành 07/6' }]
  });
  for await (const part of stream.fullStream) {
    console.log('PART TYPE:', part.type, 'KEYS:', Object.keys(part));
    if (part.type === 'tool-result') {
      console.log('TOOL RESULT PART:', JSON.stringify(part));
    }
  }
}
run().catch(console.error);
