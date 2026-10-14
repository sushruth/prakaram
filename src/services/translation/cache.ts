import { TRANSLATION_PROVIDERS } from './providers';

/**
 * On-the-wire translation with a browser cache and a small request queue. Lines are fetched lazily as
 * they are read, so a long prakaram does not translate all at once, and the same line is never fetched
 * twice. Nothing is stored in git: the Cache API store lives in the browser only.
 */

const CACHE = 'prakaram-translation-v1';
const SL = 'sa';
const TL = 'en';
/** Two requests at a time is enough to keep scrolling smooth without hammering a public endpoint. */
const MAX_CONCURRENCY = 2;

const hasCache = () => typeof caches !== 'undefined';

/** Trim and collapse whitespace, so the same line written twice shares one cache entry. */
const normalize = (text: string) => text.trim().replace(/\s+/g, ' ');

/** The Cache API key: `provider|sl|tl|<text>`, URL-encoded so it is a valid request URL. */
export const translationCacheKey = (providerId: string, text: string) =>
  `/__translation/${encodeURIComponent(`${providerId}|${SL}|${TL}|${normalize(text)}`)}`;

async function cacheGet(providerId: string, text: string): Promise<string | undefined> {
  if (!hasCache()) return undefined;
  try {
    const hit = await (await caches.open(CACHE)).match(translationCacheKey(providerId, text));
    return hit ? (await hit.text()) || undefined : undefined;
  } catch {
    return undefined;
  }
}

async function cachePut(providerId: string, text: string, value: string): Promise<void> {
  if (!hasCache()) return;
  try {
    await (await caches.open(CACHE)).put(translationCacheKey(providerId, text), new Response(value, { headers: { 'content-type': 'text/plain; charset=utf-8' } }));
  } catch {
    /* A full or unavailable cache must not break the reader. */
  }
}

/** Runs at most `MAX_CONCURRENCY` tasks at once; the rest wait their turn. */
let active = 0;
const waiting: (() => void)[] = [];

function runQueued<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const start = () => {
      active += 1;
      task()
        .then(resolve, reject)
        .finally(() => {
          active -= 1;
          waiting.shift()?.();
        });
    };
    if (active < MAX_CONCURRENCY) start();
    else waiting.push(start);
  });
}

/** Concurrent calls for the same line share one request. */
const inFlight = new Map<string, Promise<string | undefined>>();
/** Lines a provider could not translate this session, so a scroll back does not re-request them. */
const missed = new Set<string>();

async function fetchTranslation(line: string, original: string, signal?: AbortSignal): Promise<string | undefined> {
  for (const provider of TRANSLATION_PROVIDERS) {
    const cached = await cacheGet(provider.id, line);
    if (cached) return cached;
    if (missed.has(`${provider.id}|${line}`)) continue;
    const result = await runQueued(() => provider.translate(original, signal).catch(() => undefined));
    if (result) {
      await cachePut(provider.id, line, result);
      return result;
    }
    missed.add(`${provider.id}|${line}`);
  }
  return undefined;
}

/**
 * The translation of one line: from the Cache API when we have it, else fetched through the providers
 * (primary, then fallback) one at a time. The key text is normalised but the original is what is sent.
 * Concurrent calls for the same line share one request. Resolves undefined when no provider answers.
 */
export function translateLine(text: string, signal?: AbortSignal): Promise<string | undefined> {
  const line = normalize(text);
  if (!line) return Promise.resolve(undefined);
  const existing = inFlight.get(line);
  if (existing) return existing;
  const job = fetchTranslation(line, text, signal).finally(() => inFlight.delete(line));
  inFlight.set(line, job);
  return job;
}
