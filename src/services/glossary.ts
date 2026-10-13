import raw from '../data/glossary.json';
import { transliterateVedic } from './transliteration';
import { ORDINALS } from './cite';

export interface GlossaryEntry {
  id: string;
  /** Devanagari form (shown in the selected script). */
  sa: string;
  iast: string;
  /** A few words of English. */
  gloss: string;
  note?: string;
}

const EN_ORDINALS = [
  'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
  'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth', 'twentieth',
  'twenty-first', 'twenty-second', 'twenty-third', 'twenty-fourth', 'twenty-fifth', 'twenty-sixth', 'twenty-seventh', 'twenty-eighth', 'twenty-ninth', 'thirtieth',
];

// The ordinal words of citeInWords come from cite.ts (never typed twice); only the English comes from here.
const ordinals: GlossaryEntry[] = ORDINALS.slice(1).map((sa, i) => ({
  id: `ordinal-${i + 1}`,
  sa,
  iast: transliterateVedic(sa, 'iast'),
  gloss: EN_ORDINALS[i],
  note: 'An ordinal, as used in citations.',
}));

export const GLOSSARY_FILE: GlossaryEntry[] = raw as GlossaryEntry[];
export const GLOSSARY: Record<string, GlossaryEntry> = Object.fromEntries([...GLOSSARY_FILE, ...ordinals].map((e) => [e.id, e]));
