import { lineClass } from '../config/lineClass';
import { MantraChunk } from '../types/mantra';
import { clusters, SwaraTone, toneOf } from './swaraSegments';

/** One box in a row: a syllable (with its swara tone, if any) or a blank for a word gap. */
export interface MinimapCell {
  blank?: boolean;
  tone?: SwaraTone;
}

export interface MinimapRow {
  /** Colour class shared with the reader's line. */
  className: string;
  cells: MinimapCell[];
}

/** The longest of the three lines is shrunk to at most this many boxes; the others use the same ratio. */
export const MINIMAP_MAX_CELLS = 24;

/** Take the previous, current and next chunk and return the three rows to draw. A missing chunk is null. */
export function minimap(chunks: [MantraChunk?, MantraChunk?, MantraChunk?]): (MinimapRow | null)[] {
  const parts = chunks.map((c) => (c ? clusters(c.sanskrit.trim()) : []));
  const longest = Math.max(1, ...parts.map((p) => p.length));
  const group = Math.ceil(longest / MINIMAP_MAX_CELLS);
  return chunks.map((c, i) => {
    if (!c) return null;
    const cells: MinimapCell[] = [];
    for (let at = 0; at < parts[i].length; at += group) {
      const bucket = parts[i].slice(at, at + group);
      if (bucket.every((k) => /^\s+$/.test(k))) cells.push({ blank: true });
      else cells.push({ tone: bucket.map(toneOf).find(Boolean) });
    }
    return { className: lineClass(c), cells };
  });
}
