import type { ScriptTransliterator } from './types';

export const devanagari: ScriptTransliterator = {
  id: 'devanagari',
  label: 'Devanagari',
  native: 'संस्कृतम्',
  transliterate: (src) => src,
};
