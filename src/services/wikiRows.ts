import { ALL_SUKTAMS } from '../data';
import { findPiece, pieceChunks } from './koshah';
import { padyas, type Padya } from './padya';
import type { MantraChunk, MantraDocument } from '../types/mantra';
import type { Pos } from './nirdesa';
import type { WikiArticle, WikiSection } from './wiki';

/** A section heading. */
export interface HeadingRow {
  type: 'heading';
  key: string;
  section: WikiSection;
}
/** One pada of a section, with the pieces the line renderer needs. */
export interface LineRow {
  type: 'line';
  key: string;
  section: number;
  pos: Pos;
  chunk: MantraChunk;
  /** True for a source (padas are numbered and selectable); false for a composition's referenced parts. */
  own: boolean;
  /** The section's padya level, or null where it has none. */
  groups: Padya[] | null;
  /** The padya this pada closes, where it closes one. */
  endOf: Padya | undefined;
}
/** The selection's actions, shown once after the last picked pada. */
export interface RangeRow {
  type: 'range';
  key: string;
}
/** A section whose text could not be resolved. */
export interface MissingRow {
  type: 'missing';
  key: string;
}
export type WikiRow = HeadingRow | LineRow | RangeRow | MissingRow;

const cmp = (a: Pos, b: Pos) => a.section - b.section || a.pada - b.pada;

/**
 * The article body as one flat list, in document order: a heading per section, a line per pada, the
 * selection's range row after the last picked pada, and a placeholder where a section has no text.
 * This is the unit the window scrolls; the article's chrome around it is not windowed. Pure, so the
 * windowing hook can be reasoned about against a plain array.
 */
export function buildRows(
  article: WikiArticle,
  doc: MantraDocument | undefined,
  own: boolean,
  hi: Pos | undefined,
): WikiRow[] {
  const rows: WikiRow[] = [];
  for (const section of article.sections) {
    rows.push({ type: 'heading', key: `h-${section.id}`, section });
    const piece = findPiece(ALL_SUKTAMS, section.pieceId);
    if (!piece) {
      rows.push({ type: 'missing', key: `m-${section.id}` });
      continue;
    }
    const sec = own ? doc?.sections.find((x) => x.sectionNumber === section.number) : undefined;
    const groups = sec ? padyas(sec) : null;
    pieceChunks(ALL_SUKTAMS, piece).forEach((chunk, i) => {
      const pos: Pos = { section: section.number, pada: i + 1 };
      rows.push({
        type: 'line',
        key: `${chunk.id}-${i}`,
        section: section.number,
        pos,
        chunk,
        own,
        groups,
        endOf: groups?.find((g) => g.to === pos.pada),
      });
      if (own && hi && cmp(pos, hi) === 0) rows.push({ type: 'range', key: `r-${chunk.id}-${i}` });
    });
  }
  return rows;
}
