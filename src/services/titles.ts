import { DEFAULT_PRAKARAS } from '../data';
import { countAksharas, truncateAksharas } from './aksharas';
import { displayToDevanagari } from './transliteration/toDevanagari';

const sanskritPart = (title: string): string => displayToDevanagari(splitTitle(title).sanskrit);

export interface TitleParts {
  sanskrit: string;
  english: string;
}

export function splitTitle(title: string): TitleParts {
  const m = title.match(/^(.*?)\s*\((.*)\)\s*$/);
  return m ? { sanskrit: m[1].trim(), english: m[2].trim() } : { sanskrit: title.trim(), english: '' };
}

/** The mixed 'Sanskrit (English)' string a Prakara title and item name use. */
export const mixedTitle = (t: { sanskrit: string; english: string }) => (t.sanskrit ? `${t.sanskrit} (${t.english})` : t.english);

export const TITLE_AKSHARA_LIMIT = Math.max(
  ...DEFAULT_PRAKARAS.map((p) => countAksharas(sanskritPart(p.title))),
);

export function displayTitle(title: string): string {
  return truncateAksharas(sanskritPart(title), TITLE_AKSHARA_LIMIT);
}
