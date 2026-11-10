import { ALL_SUKTAMS } from '../data';
import { findPiece, pieceChunks } from './koshah';
import type { MantraChunk, MantraDocument } from '../types/mantra';
import type { Pos } from './nirdesa';
import type { WikiArticle, WikiSection } from './wiki';

/** A section heading. */
export interface HeadingRow {
  type: 'heading';
  key: string;
  section: WikiSection;
}
/** One pada inside a section's running text. */
export interface Pada {
  pos: Pos;
  chunk: MantraChunk;
}
/** A section's padas as one paragraph of running text, like a page of the book view. */
export interface ProseRow {
  type: 'prose';
  key: string;
  section: number;
  padas: Pada[];
  /** True for a source (padas are numbered and selectable); false for a composition's referenced parts. */
  own: boolean;
}
/** A section whose text could not be resolved. */
export interface MissingRow {
  type: 'missing';
  key: string;
}
export type WikiRow = HeadingRow | ProseRow | MissingRow;

/**
 * The article body as one flat list, in document order: a heading and a paragraph of running text per
 * section, and a placeholder where a section has no text. The selection's actions render inside the
 * paragraph, right after the last picked pada.
 * This is the unit the window scrolls; the article's chrome around it is not windowed. Pure, so the
 * windowing hook can be reasoned about against a plain array.
 */
export function buildRows(
  article: WikiArticle,
  doc: MantraDocument | undefined,
  own: boolean,
): WikiRow[] {
  const rows: WikiRow[] = [];
  for (const section of article.sections) {
    rows.push({ type: 'heading', key: `h-${section.id}`, section });
    const piece = findPiece(ALL_SUKTAMS, section.pieceId);
    if (!piece) {
      rows.push({ type: 'missing', key: `m-${section.id}` });
      continue;
    }
    const padas = pieceChunks(ALL_SUKTAMS, piece).map((chunk, i): Pada => ({ pos: { section: section.number, pada: i + 1 }, chunk }));
    rows.push({ type: 'prose', key: `p-${section.id}`, section: section.number, padas, own });
  }
  return rows;
}
