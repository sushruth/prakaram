import { afterEach, describe, expect, it } from 'bun:test';
import { clients5Provider, myMemoryProvider, parseClients5, parseMyMemory, translateText } from './providers';

const stubFetch = (route: (url: string) => Response) => {
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    return route(url);
  }) as typeof fetch;
  return calls;
};

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
const error = () => new Response('nope', { status: 500 });

afterEach(() => {
  delete (globalThis as { fetch?: unknown }).fetch;
});

describe('parseClients5', () => {
  it('reads the flat dict-chrome-ex shape', () => {
    expect(parseClients5(['The priest in the firemill.'])).toBe('The priest in the firemill.');
  });

  it('reads an array of arrays and deeper nesting, joined to one line', () => {
    expect(parseClients5([['The priest']])).toBe('The priest');
    expect(parseClients5([[['a'], ['b']]])).toBe('a b');
  });

  it('returns undefined for empty or non-string bodies', () => {
    expect(parseClients5([])).toBeUndefined();
    expect(parseClients5(null)).toBeUndefined();
    expect(parseClients5(42)).toBeUndefined();
  });
});

describe('parseMyMemory', () => {
  it('reads responseData.translatedText', () => {
    expect(parseMyMemory({ responseData: { translatedText: 'By fire' } })).toBe('By fire');
  });

  it('returns undefined when the field is missing or blank', () => {
    expect(parseMyMemory({ responseData: {} })).toBeUndefined();
    expect(parseMyMemory({ responseData: { translatedText: '  ' } })).toBeUndefined();
    expect(parseMyMemory('nope')).toBeUndefined();
  });
});

describe('clients5Provider', () => {
  it('asks the dictionary client for sa to en and returns the parsed line', async () => {
    const calls = stubFetch(() => json(['The priest in the firemill.']));
    expect(await clients5Provider.translate('अ॒ग्निमी॑ळे')).toBe('The priest in the firemill.');
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('clients5.google.com/translate_a/t');
    expect(calls[0]).toContain('client=dict-chrome-ex');
    expect(calls[0]).toContain('sl=sa');
    expect(calls[0]).toContain('tl=en');
    expect(calls[0]).toContain(encodeURIComponent('अ॒ग्निमी॑ळे'));
  });

  it('returns undefined on an HTTP error and on a thrown fetch', async () => {
    stubFetch(error);
    expect(await clients5Provider.translate('x')).toBeUndefined();
    globalThis.fetch = (async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;
    expect(await clients5Provider.translate('x')).toBeUndefined();
  });
});

describe('myMemoryProvider', () => {
  it('asks with the sa|en language pair and returns the parsed line', async () => {
    const calls = stubFetch(() => json({ responseData: { translatedText: 'By fire' } }));
    expect(await myMemoryProvider.translate('अ॒ग्निमी॑ळे')).toBe('By fire');
    expect(calls[0]).toContain('api.mymemory.translated.net/get');
    expect(calls[0]).toContain('langpair=sa%7Cen');
  });

  it('skips a line over the 500-byte anonymous cap without fetching', async () => {
    const calls = stubFetch(() => json({ responseData: { translatedText: 'x' } }));
    expect(await myMemoryProvider.translate('क'.repeat(600))).toBeUndefined();
    expect(calls).toEqual([]);
  });
});

describe('translateText', () => {
  it('falls back to the second provider when the first fails', async () => {
    const calls = stubFetch((url) =>
      url.includes('clients5') ? error() : json({ responseData: { translatedText: 'By fire' } }),
    );
    expect(await translateText('अ॒ग्निमी॑ळे')).toBe('By fire');
    expect(calls).toHaveLength(2);
  });

  it('returns undefined when both providers fail', async () => {
    const calls = stubFetch(error);
    expect(await translateText('अ॒ग्निमी॑ळे')).toBeUndefined();
    expect(calls).toHaveLength(2);
  });
});
