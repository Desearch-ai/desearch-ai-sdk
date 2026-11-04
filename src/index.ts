import type { Desearch } from 'desearch-js';
import { resolveClient, type DesearchToolOptions } from './client';
import {
  aiSearch,
  toolFactories,
  webCrawl,
  webLinksSearch,
  webSearch,
  xLinksSearch,
  xSearch,
  type DesearchToolName,
} from './tools';

export interface DesearchToolsOptions<T extends DesearchToolName = DesearchToolName>
  extends DesearchToolOptions {
  /** Only include these tools. Defaults to all six. */
  include?: T[];
}

export type DesearchTools<T extends DesearchToolName = DesearchToolName> = {
  [K in T]: ReturnType<(typeof toolFactories)[K]>;
};

/**
 * Desearch tools as an object for the `tools` option of generateText or streamText.
 * All tools share one desearch-js client, created on the first call.
 */
export function desearchTools<T extends DesearchToolName = DesearchToolName>(
  options: DesearchToolsOptions<T> = {},
): DesearchTools<T> {
  const { include, ...clientOptions } = options;
  let client: Desearch | undefined;
  const shared: DesearchToolOptions = {
    get client() {
      return (client ??= resolveClient(clientOptions));
    },
  };
  const names = (include ?? Object.keys(toolFactories)) as T[];
  const out: Record<string, unknown> = {};
  for (const name of names) {
    const factory = toolFactories[name];
    if (!factory) throw new Error(`Unknown Desearch tool: ${String(name)}`);
    out[name] = factory(shared);
  }
  return out as DesearchTools<T>;
}

export { aiSearch, webSearch, webLinksSearch, xSearch, xLinksSearch, webCrawl };
export type { DesearchToolOptions, DesearchToolName };
