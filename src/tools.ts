import { tool } from 'ai';
import { z } from 'zod';
import { lazyClient, type DesearchToolOptions } from './client';

const sources = ['web', 'hackernews', 'reddit', 'wikipedia', 'youtube', 'twitter', 'arxiv'] as const;
const webSources = ['web', 'hackernews', 'reddit', 'wikipedia', 'youtube', 'arxiv'] as const;
const dateFilters = [
  'PAST_24_HOURS',
  'PAST_2_DAYS',
  'PAST_WEEK',
  'PAST_2_WEEKS',
  'PAST_MONTH',
  'PAST_2_MONTHS',
  'PAST_YEAR',
  'PAST_2_YEARS',
] as const;

/** AI search across web, X, Reddit, YouTube, Hacker News, Wikipedia and arXiv, with links and a summary. */
export function aiSearch(options: DesearchToolOptions = {}) {
  const client = lazyClient(options);
  return tool({
    description:
      'Search several sources at once (web, X, Reddit, YouTube, Hacker News, Wikipedia, arXiv) with Desearch AI search. Returns result links grouped by source plus a written summary.',
    inputSchema: z.object({
      prompt: z.string().min(1).describe('The search prompt or question.'),
      tools: z
        .array(z.enum(sources))
        .min(1)
        .optional()
        .describe('Sources to search. Use "twitter" for X. Defaults to ["web"].'),
      dateFilter: z.enum(dateFilters).optional().describe('Only include results from this time window.'),
      resultType: z
        .enum(['ONLY_LINKS', 'LINKS_WITH_FINAL_SUMMARY'])
        .optional()
        .describe('Return only links, or links plus a summary. Defaults to LINKS_WITH_FINAL_SUMMARY.'),
      count: z.number().int().min(10).max(200).optional().describe('Results per source (10 to 200).'),
    }),
    execute: async ({ prompt, tools, dateFilter, resultType, count }) =>
      client().aiSearch({
        prompt,
        tools: [...(tools ?? ['web'])],
        date_filter: dateFilter ?? null,
        result_type: resultType ?? 'LINKS_WITH_FINAL_SUMMARY',
        count: count ?? null,
      }),
  });
}

/** Web search results (title, link, snippet) for a query. */
export function webSearch(options: DesearchToolOptions = {}) {
  const client = lazyClient(options);
  return tool({
    description: 'Search the web with Desearch. Returns a page of results with title, link and snippet.',
    inputSchema: z.object({
      query: z.string().min(1).describe('The search query.'),
      start: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe('Number of results to skip, for pagination (0, 10, 20). Defaults to 0.'),
    }),
    execute: async ({ query, start }) => client().webSearch({ query, start: start ?? 0 }),
  });
}

/** AI-ranked links from web sources (no X). */
export function webLinksSearch(options: DesearchToolOptions = {}) {
  const client = lazyClient(options);
  return tool({
    description:
      'Find relevant links for a prompt across web sources (web, Hacker News, Reddit, Wikipedia, YouTube, arXiv) with Desearch. Returns links without a summary.',
    inputSchema: z.object({
      prompt: z.string().min(1).describe('What to find links for.'),
      tools: z.array(z.enum(webSources)).min(1).optional().describe('Sources to search. Defaults to ["web"].'),
      count: z.number().int().min(10).max(200).optional().describe('Results per source (10 to 200).'),
    }),
    execute: async ({ prompt, tools, count }) =>
      client().aiWebLinksSearch({ prompt, tools: [...(tools ?? ['web'])], count: count ?? null }),
  });
}

/** Search posts on X with filters. */
export function xSearch(options: DesearchToolOptions = {}) {
  const client = lazyClient(options);
  return tool({
    description:
      'Search posts on X (Twitter) with Desearch. Supports sort order, author, date range, language and minimum likes filters.',
    inputSchema: z.object({
      query: z.string().min(1).describe('The X search query.'),
      sort: z.enum(['Top', 'Latest']).optional().describe('Sort by Top or Latest. Defaults to Top.'),
      user: z.string().optional().describe('Only posts from this username, without @.'),
      startDate: z.string().optional().describe('Start date, YYYY-MM-DD (UTC).'),
      endDate: z.string().optional().describe('End date, YYYY-MM-DD (UTC).'),
      lang: z.string().optional().describe('Language code, for example en.'),
      minLikes: z.number().int().min(0).optional().describe('Minimum number of likes.'),
      count: z.number().int().min(1).max(100).optional().describe('Number of posts (1 to 100). Defaults to 20.'),
    }),
    execute: async ({ query, sort, user, startDate, endDate, lang, minLikes, count }) =>
      client().xSearch({
        query,
        sort: sort ?? 'Top',
        user: user ?? null,
        start_date: startDate ?? null,
        end_date: endDate ?? null,
        lang: lang ?? null,
        min_likes: minLikes ?? null,
        count: count ?? 20,
      }),
  });
}

/** AI-ranked links to X posts for a prompt. */
export function xLinksSearch(options: DesearchToolOptions = {}) {
  const client = lazyClient(options);
  return tool({
    description: 'Find links to X (Twitter) posts relevant to a prompt with Desearch AI search.',
    inputSchema: z.object({
      prompt: z.string().min(1).describe('What to find X posts about.'),
      count: z.number().int().min(10).max(200).optional().describe('Number of results (10 to 200).'),
    }),
    execute: async ({ prompt, count }) => client().aiXLinksSearch({ prompt, count: count ?? null }),
  });
}

/** Fetch a public URL and return its content as text or HTML. */
export function webCrawl(options: DesearchToolOptions = {}) {
  const client = lazyClient(options);
  return tool({
    description: 'Fetch a public web page with Desearch and return its content as plain text (default) or HTML.',
    inputSchema: z.object({
      url: z.string().url().describe('Public URL to fetch.'),
      format: z.enum(['text', 'html']).optional().describe('Return plain text or HTML. Defaults to text.'),
    }),
    execute: async ({ url, format }) => client().extract({ url, format: format ?? 'text' }),
  });
}

export const toolFactories = {
  aiSearch,
  webSearch,
  webLinksSearch,
  xSearch,
  xLinksSearch,
  webCrawl,
} as const;

export type DesearchToolName = keyof typeof toolFactories;
