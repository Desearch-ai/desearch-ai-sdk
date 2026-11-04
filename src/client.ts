import { Desearch } from 'desearch-js';

export interface DesearchToolOptions {
  /** Desearch API key. Defaults to process.env.DESEARCH_API_KEY. */
  apiKey?: string;
  /** Use your own desearch-js client instead of creating one. */
  client?: Desearch;
}

export function resolveClient(options: DesearchToolOptions = {}): Desearch {
  if (options.client) return options.client;
  const apiKey =
    options.apiKey ??
    (typeof process !== 'undefined' ? process.env?.DESEARCH_API_KEY : undefined);
  if (!apiKey) {
    throw new Error(
      'Missing Desearch API key. Pass { apiKey } or set the DESEARCH_API_KEY environment variable. Get a key at https://console.desearch.ai/api-keys',
    );
  }
  return new Desearch(apiKey);
}

/** Lazily create the client on first execute(), so tools can be defined before env is loaded. */
export function lazyClient(options: DesearchToolOptions = {}): () => Desearch {
  let client: Desearch | undefined;
  return () => (client ??= resolveClient(options));
}
