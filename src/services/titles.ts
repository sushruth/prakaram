import { DEFAULT_PRAKARAS } from '../data';
import { countAksharas, truncateAksharas } from './aksharas';

export interface TitleParts {
  sanskrit: string;
  english: string;
}

export function splitTitle(title: string): TitleParts {
  const m = title.match(/^(.*?)\s*\((.*)\)\s*$/);
  return m ? { sanskrit: m[1].trim(), english: m[2].trim() } : { sanskrit: title.trim(), english: '' };
}

export const TITLE_AKSHARA_LIMIT = Math.max(
  ...DEFAULT_PRAKARAS.map((p) => countAksharas(splitTitle(p.title).sanskrit)),
);

export function displayTitle(title: string): string {
  return truncateAksharas(splitTitle(title).sanskrit, TITLE_AKSHARA_LIMIT);
}
