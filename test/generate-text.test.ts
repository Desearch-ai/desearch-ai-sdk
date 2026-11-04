import { generateText, isStepCount } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { describe, expect, it } from 'vitest';
import { webSearch } from '../src/index';

// Runs the registry-style pattern (generateText + tools + stopWhen: isStepCount(3)) with a mock model
// that asks for one webSearch call. The tool call itself hits the real Desearch API, so this needs DESEARCH_API_KEY.
const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
};

describe.skipIf(!process.env.DESEARCH_API_KEY)('generateText with desearch-ai-sdk tools', () => {
  it('runs webSearch inside generateText', async () => {
    const model = new MockLanguageModelV4({
      doGenerate: [
        {
          content: [
            {
              type: 'tool-call',
              toolCallId: 'call-1',
              toolName: 'webSearch',
              input: JSON.stringify({ query: 'Bittensor subnet 22' }),
            },
          ],
          finishReason: { unified: 'tool-calls', raw: undefined },
          usage,
          warnings: [],
        },
        {
          content: [{ type: 'text', text: 'done' }],
          finishReason: { unified: 'stop', raw: undefined },
          usage,
          warnings: [],
        },
      ] as never,
    });

    const result = await generateText({
      model,
      prompt: 'Find pages about Bittensor subnet 22.',
      tools: { webSearch: webSearch() },
      stopWhen: isStepCount(3),
    });

    const toolResults = result.steps.flatMap((s) => s.toolResults);
    console.log('generateText steps:', result.steps.length, 'toolResults:', toolResults.length, 'text:', result.text);
    expect(toolResults.length).toBe(1);
    const output = toolResults[0].output as { data: { link: string }[] };
    console.log('webSearch via generateText first link:', output.data[0].link, 'results:', output.data.length);
    expect(output.data.length).toBeGreaterThan(0);
    expect(result.text).toBe('done');
  }, 60_000);
});
