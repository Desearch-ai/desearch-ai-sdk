import { describe, expect, it } from 'vitest';
import { desearchTools } from '../src/index';

// Real calls against the Desearch API. Needs DESEARCH_API_KEY. Each call is billed to that key.
const hasKey = Boolean(process.env.DESEARCH_API_KEY);
const ctx = { toolCallId: 'live', messages: [], context: {} };
const summary = (v: unknown) => {
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return `${Array.isArray(v) ? `array(${v.length})` : typeof v} len=${s.length} | ${s.slice(0, 160)}`;
};

describe.skipIf(!hasKey)('live Desearch calls', () => {
  const t = desearchTools();

  it('aiSearch', async () => {
    const r = (await t.aiSearch.execute!(
      { prompt: 'What is Bittensor?', tools: ['web'], dateFilter: 'PAST_MONTH', resultType: 'LINKS_WITH_FINAL_SUMMARY' },
      ctx,
    )) as Record<string, unknown>;
    console.log('aiSearch:', summary(r));
    expect(r).toBeTypeOf('object');
    expect(Object.keys(r).length).toBeGreaterThan(0);
  }, 120_000);

  it('webSearch', async () => {
    const r = (await t.webSearch.execute!({ query: 'Bittensor subnet 22', start: 0 }, ctx)) as {
      data: { link: string }[];
    };
    console.log('webSearch:', summary(r));
    expect(r.data.length).toBeGreaterThan(0);
    expect(r.data[0].link).toMatch(/^https?:\/\//);
  }, 60_000);

  it('webLinksSearch', async () => {
    const r = await t.webLinksSearch.execute!({ prompt: 'Bittensor subnets', tools: ['web'], count: 10 }, ctx);
    console.log('webLinksSearch:', summary(r));
    expect(JSON.stringify(r)).toMatch(/https?:\/\//);
  }, 120_000);

  it('xSearch', async () => {
    const r = await t.xSearch.execute!({ query: 'Bittensor', sort: 'Latest', count: 5 }, ctx);
    console.log('xSearch:', summary(r));
    expect(Array.isArray(r) ? r.length : Object.keys(r as object).length).toBeGreaterThan(0);
  }, 60_000);

  it('xLinksSearch', async () => {
    const r = await t.xLinksSearch.execute!({ prompt: 'Bittensor news', count: 10 }, ctx);
    console.log('xLinksSearch:', summary(r));
    expect(JSON.stringify(r)).toMatch(/x\.com|twitter\.com/);
  }, 120_000);

  it('webCrawl', async () => {
    // The fetch endpoint can return 404 "No content found." (cost 0) intermittently; retry once.
    const run = async () => await t.webCrawl.execute!({ url: 'https://desearch.ai', format: 'text' }, ctx);
    const r = await run().catch((e: unknown) => {
      console.log('webCrawl first attempt failed, retrying:', String(e).slice(0, 120));
      return run();
    });
    console.log('webCrawl:', summary(r));
    expect(typeof r).toBe('string');
    expect((r as string).length).toBeGreaterThan(50);
  }, 60_000);
});
