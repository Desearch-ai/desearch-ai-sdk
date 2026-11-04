import { describe, expect, it, vi } from 'vitest';
import type { Desearch } from 'desearch-js';
import {
  aiSearch,
  desearchTools,
  webCrawl,
  webLinksSearch,
  webSearch,
  xLinksSearch,
  xSearch,
} from '../src/index';

const ctx = { toolCallId: 't1', messages: [], context: {} };

function fakeClient() {
  return {
    aiSearch: vi.fn(async () => ({ text: 'summary' })),
    webSearch: vi.fn(async () => ({ data: [{ title: 'a', link: 'https://a', snippet: 's' }] })),
    aiWebLinksSearch: vi.fn(async () => ({ search_results: [] })),
    xSearch: vi.fn(async () => [{ id: '1', text: 'post' }]),
    aiXLinksSearch: vi.fn(async () => ({ miner_tweets: [] })),
    extract: vi.fn(async () => 'page text'),
  };
}

const parse = (t: { inputSchema: unknown }, input: unknown) =>
  (t.inputSchema as { parse: (v: unknown) => unknown }).parse(input);

describe('tool factories', () => {
  it('desearchTools returns all six tools by default', () => {
    const tools = desearchTools({ apiKey: 'test' });
    expect(Object.keys(tools).sort()).toEqual(
      ['aiSearch', 'webCrawl', 'webLinksSearch', 'webSearch', 'xLinksSearch', 'xSearch'].sort(),
    );
    for (const t of Object.values(tools)) {
      expect(typeof t.description).toBe('string');
      expect(typeof t.execute).toBe('function');
    }
  });

  it('desearchTools respects include', () => {
    const tools = desearchTools({ apiKey: 'test', include: ['webSearch', 'xSearch'] });
    expect(Object.keys(tools)).toEqual(['webSearch', 'xSearch']);
  });

  it('throws a clear error when no key is set, only at execute time', async () => {
    const saved = process.env.DESEARCH_API_KEY;
    delete process.env.DESEARCH_API_KEY;
    try {
      const t = webSearch();
      await expect(t.execute!({ query: 'q', start: 0 }, ctx)).rejects.toThrow(/DESEARCH_API_KEY/);
    } finally {
      if (saved !== undefined) process.env.DESEARCH_API_KEY = saved;
    }
  });

  it('validates input', () => {
    expect(parse(aiSearch({ apiKey: 'x' }), { prompt: 'p' })).toEqual({ prompt: 'p' });
    expect(() => parse(aiSearch({ apiKey: 'x' }), { prompt: 'p', tools: [] })).toThrow();
    expect(() => parse(xSearch({ apiKey: 'x' }), { query: 'q', count: 500 })).toThrow();
    expect(() => parse(webCrawl({ apiKey: 'x' }), { url: 'not a url' })).toThrow();
  });
});

describe('execute maps input to desearch-js', () => {
  const c = fakeClient();
  const client = c as unknown as Desearch;

  it('aiSearch', async () => {
    await aiSearch({ client }).execute!(
      { prompt: 'p', tools: ['web', 'reddit'], resultType: 'ONLY_LINKS', dateFilter: 'PAST_WEEK' },
      ctx,
    );
    expect(c.aiSearch).toHaveBeenCalledWith({
      prompt: 'p',
      tools: ['web', 'reddit'],
      date_filter: 'PAST_WEEK',
      result_type: 'ONLY_LINKS',
      count: null,
    });
  });

  it('webSearch', async () => {
    const r = await webSearch({ client }).execute!({ query: 'q', start: 10 }, ctx);
    expect(c.webSearch).toHaveBeenCalledWith({ query: 'q', start: 10 });
    expect(r).toEqual({ data: [{ title: 'a', link: 'https://a', snippet: 's' }] });
  });

  it('webLinksSearch', async () => {
    await webLinksSearch({ client }).execute!({ prompt: 'p', tools: ['arxiv'], count: 10 }, ctx);
    expect(c.aiWebLinksSearch).toHaveBeenCalledWith({ prompt: 'p', tools: ['arxiv'], count: 10 });
  });

  it('xSearch', async () => {
    await xSearch({ client }).execute!({ query: 'q', sort: 'Latest', count: 5, user: 'u' }, ctx);
    expect(c.xSearch).toHaveBeenCalledWith({
      query: 'q',
      sort: 'Latest',
      user: 'u',
      start_date: null,
      end_date: null,
      lang: null,
      min_likes: null,
      count: 5,
    });
  });

  it('applies defaults when optional fields are omitted', async () => {
    await webSearch({ client }).execute!({ query: 'q' }, ctx);
    expect(c.webSearch).toHaveBeenLastCalledWith({ query: 'q', start: 0 });
    await xSearch({ client }).execute!({ query: 'q' }, ctx);
    expect(c.xSearch).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'Top', count: 20 }));
    await aiSearch({ client }).execute!({ prompt: 'p' }, ctx);
    expect(c.aiSearch).toHaveBeenLastCalledWith(
      expect.objectContaining({ tools: ['web'], result_type: 'LINKS_WITH_FINAL_SUMMARY' }),
    );
    await webCrawl({ client }).execute!({ url: 'https://desearch.ai' }, ctx);
    expect(c.extract).toHaveBeenLastCalledWith({ url: 'https://desearch.ai', format: 'text' });
  });

  it('xLinksSearch', async () => {
    await xLinksSearch({ client }).execute!({ prompt: 'p' }, ctx);
    expect(c.aiXLinksSearch).toHaveBeenCalledWith({ prompt: 'p', count: null });
  });

  it('webCrawl uses extract', async () => {
    const r = await webCrawl({ client }).execute!({ url: 'https://desearch.ai', format: 'text' }, ctx);
    expect(c.extract).toHaveBeenCalledWith({ url: 'https://desearch.ai', format: 'text' });
    expect(r).toBe('page text');
  });
});
