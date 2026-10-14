/**
 * The translation providers, behind one interface so a provider can be swapped without touching the
 * reader. Both are keyless public endpoints reached straight from the browser (CORS `*`), so no
 * translation is bundled and no key is shipped. A provider resolves `undefined` on any failure; it
 * never throws into render.
 */

export interface TranslationProvider {
  id: string;
  label: string;
  translate(text: string, signal?: AbortSignal): Promise<string | undefined>;
}

const SL = 'sa';
const TL = 'en';

const CLIENTS5_URL = 'https://clients5.google.com/translate_a/t';
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
/** MyMemory's anonymous endpoint rejects a query longer than 500 bytes. */
const MYMEMORY_MAX_BYTES = 500;

/** Every string in a nested array, in order. */
function stringsIn(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(stringsIn);
  return [];
}

/**
 * The translated text from a clients5 body. `client=dict-chrome-ex` returns a flat array, but the
 * endpoint can also answer `[["x"]]` or a deeper nesting, so every string is collected and joined.
 */
export function parseClients5(data: unknown): string | undefined {
  const text = stringsIn(data).join(' ').replace(/\s+/g, ' ').trim();
  return text || undefined;
}

/** The translated text from a MyMemory body. */
export function parseMyMemory(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const text = (data as { responseData?: { translatedText?: unknown } }).responseData?.translatedText;
  return typeof text === 'string' && text.trim() ? text.trim() : undefined;
}

/** The primary: Google's dictionary endpoint. Keyless, but only meant for short lines. */
export const clients5Provider: TranslationProvider = {
  id: 'clients5',
  label: 'Google dictionary',
  async translate(text, signal) {
    try {
      const query = new URLSearchParams({ client: 'dict-chrome-ex', sl: SL, tl: TL, q: text });
      const res = await fetch(`${CLIENTS5_URL}?${query}`, { signal });
      if (!res.ok) return undefined;
      return parseClients5(await res.json());
    } catch {
      return undefined;
    }
  },
};

/** The fallback: MyMemory, weaker quality and a small anonymous quota, but a second chance for a line. */
export const myMemoryProvider: TranslationProvider = {
  id: 'mymemory',
  label: 'MyMemory',
  async translate(text, signal) {
    if (new TextEncoder().encode(text).length > MYMEMORY_MAX_BYTES) return undefined;
    try {
      const query = new URLSearchParams({ q: text, langpair: `${SL}|${TL}` });
      const res = await fetch(`${MYMEMORY_URL}?${query}`, { signal });
      if (!res.ok) return undefined;
      return parseMyMemory(await res.json());
    } catch {
      return undefined;
    }
  },
};

/** In order of preference: the primary first, the fallback after it. */
export const TRANSLATION_PROVIDERS: TranslationProvider[] = [clients5Provider, myMemoryProvider];

/** The first provider that answers, else undefined. Never throws. */
export async function translateText(text: string, signal?: AbortSignal): Promise<string | undefined> {
  for (const provider of TRANSLATION_PROVIDERS) {
    const result = await provider.translate(text, signal);
    if (result) return result;
  }
  return undefined;
}
