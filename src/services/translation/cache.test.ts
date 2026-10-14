import { afterEach, describe, expect, it } from 'bun:test';
import { translationCacheKey, translateLine } from './cache';

const installStubs = (route: (url: string) => Response) => {
  const store = new Map<string, Response>();
  const opened: string[] = [];
  const fetchCalls: string[] = [];
  globalThis.caches = {
    open: async (name: string) => {
      opened.push(name);
      return {
        match: async (key: string) => store.get(key),
        put: async (key: string, res: Response) => void store.set(key, res),
      };
    },
  } as unknown as CacheStorage;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    fetchCalls.push(url);
    return route(url);
  }) as typeof fetch;
  return { store, opened, fetchCalls };
};

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
const ok = () => json(['A translated line.']);
const fail = () => new Response('nope', { status: 500 });

afterEach(() => {
  delete (globalThis as { fetch?: unknown }).fetch;
  delete (globalThis as { caches?: unknown }).caches;
});

describe('translationCacheKey', () => {
  it('is provider|sl|tl|<normalised text>, URL-encoded', () => {
    const key = translationCacheKey('clients5', '  a   b  ');
    expect(key.startsWith('/__translation/')).toBe(true);
    expect(decodeURIComponent(key.replace('/__translation/', ''))).toBe('clients5|sa|en|a b');
  });
});

describe('translateLine', () => {
  it('stores a translation in the Cache API and serves it without a second fetch', async () => {
    const { store, opened, fetchCalls } = installStubs(ok);
    expect(await translateLine('line one')).toBe('A translated line.');
    expect(fetchCalls).toHaveLength(1);
    expect(opened).toContain('prakaram-translation-v1');
    expect(store.size).toBe(1);
    expect(await translateLine('line one')).toBe('A translated line.');
    expect(fetchCalls).toHaveLength(1);
  });

  it('normalises the key, so the same line with different spacing is one request', async () => {
    const { fetchCalls } = installStubs(ok);
    await translateLine('  line   two ');
    expect(await translateLine('line two')).toBe('A translated line.');
    expect(fetchCalls).toHaveLength(1);
  });

  it('collapses concurrent identical requests into one fetch', async () => {
    const { fetchCalls } = installStubs(ok);
    const [a, b] = await Promise.all([translateLine('line three'), translateLine('line three')]);
    expect(a).toBe('A translated line.');
    expect(b).toBe('A translated line.');
    expect(fetchCalls).toHaveLength(1);
  });

  it('falls back to the second provider and caches its answer', async () => {
    const { fetchCalls } = installStubs((url) =>
      url.includes('clients5') ? fail() : json({ responseData: { translatedText: 'By fire' } }),
    );
    expect(await translateLine('line four')).toBe('By fire');
    expect(fetchCalls).toHaveLength(2);
    expect(await translateLine('line four')).toBe('By fire');
    expect(fetchCalls).toHaveLength(2);
  });

  it('returns undefined when both providers fail, and does not re-request in the same session', async () => {
    const { fetchCalls } = installStubs(fail);
    expect(await translateLine('line five')).toBeUndefined();
    expect(fetchCalls).toHaveLength(2);
    expect(await translateLine('line five')).toBeUndefined();
    expect(fetchCalls).toHaveLength(2);
  });

  it('returns undefined without fetching for a blank line', async () => {
    const { fetchCalls } = installStubs(ok);
    expect(await translateLine('   ')).toBeUndefined();
    expect(fetchCalls).toEqual([]);
  });
});
