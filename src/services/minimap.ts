import { lineClass } from '../config/lineClass';
import { MantraChunk } from '../types/mantra';

export interface MinimapRow {
  /** Colour class shared with the reader's line. */
  className: string;
  /** Row width as a percentage of the longest of the three lines. */
  widthPct: number;
  /** One entry per word: its length, used as the dash's relative width. */
  words: number[];
}

/** Take the previous, current and next chunk and return the three rows to draw. A missing chunk is null. */
export function minimap(chunks: [MantraChunk?, MantraChunk?, MantraChunk?]): (MinimapRow | null)[] {
  const longest = Math.max(1, ...chunks.map((c) => c?.sanskrit.length ?? 0));
  return chunks.map((c) =>
    c
      ? {
          className: lineClass(c),
          widthPct: (100 * c.sanskrit.length) / longest,
          words: c.sanskrit.split(/\s+/).filter(Boolean).map((w) => w.length),
        }
      : null,
  );
}
