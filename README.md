# desearch-ai-sdk

Desearch tools for the [AI SDK](https://ai-sdk.dev).

> README stub. The full README is in progress.

```bash
npm install desearch-ai-sdk ai zod
```

```ts
import { generateText, isStepCount } from 'ai';
import { webSearch } from 'desearch-ai-sdk';

const { text } = await generateText({
  model: 'openai/gpt-5-mini',
  prompt: 'Find recent pages about Bittensor subnet 22.',
  tools: { webSearch: webSearch() },
  stopWhen: isStepCount(3),
});
```

Set `DESEARCH_API_KEY` (get a key at https://console.desearch.ai/api-keys) or pass `{ apiKey }` to any tool.

Tools: `aiSearch`, `webSearch`, `webLinksSearch`, `xSearch`, `xLinksSearch`, `webCrawl`, or all of them with `desearchTools()`.

License: MIT
