import { lineClass } from '../config/lineClass';
import { MantraChunk } from '../types/mantra';
import { clusters, SwaraTone, toneOf } from './swaraSegments';

/** One box in a row: a syllable (with its swara tone, if any) or a blank for a word gap. */
export interface MinimapCell {
  blank?: boolean;
  tone?: SwaraTone;
}

/** A chunk as the reader shows it: one entry per wrapped screen line. */
export interface MinimapRow {
  /** Colour class shared with the reader's line. */
  className: string;
  lines: MinimapCell[][];
}

/** The longest screen line of the window is shrunk to at most this many boxes; every other line uses the same ratio. */
export const MINIMAP_MAX_CELLS = 24;

const isSpace = (k: string) => /^\s+$/.test(k);

/**
 * Take a window of chunks (the minimap uses two before and two after the current one) and return the rows to draw.
 * `breaks[i]` is how many characters of chunk i sit on each wrapped screen line, as measured from the page.
 * Without it a chunk is one line. A missing chunk is null.
 */
export function minimap(
  chunks: (MantraChunk | undefined)[],
  breaks: (number[] | undefined)[] = [],
): (MinimapRow | null)[] {
  // Split each chunk's syllables across its screen lines, in proportion to the measured characters.
  const split = chunks.map((c, i) => {
    if (!c) return null;
    const parts = clusters(c.sanskrit.trim());
    const counts = breaks[i]?.length ? breaks[i]! : [1];
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    let seen = 0;
    let from = 0;
    return counts.map((n) => {
      seen += n;
      const to = Math.round((seen / total) * parts.length);
      const line = parts.slice(from, to);
      from = to;
      while (line.length && isSpace(line[0])) line.shift();
      while (line.length && isSpace(line[line.length - 1])) line.pop();
      return line;
    });
  });
  const longest = Math.max(1, ...split.flatMap((s) => s?.map((l) => l.length) ?? []));
  const group = Math.ceil(longest / MINIMAP_MAX_CELLS);
  return chunks.map((c, i) => {
    const lines = split[i];
    if (!c || !lines) return null;
    return {
      className: lineClass(c),
      lines: lines
        .filter((l) => l.length)
        .map((l) => {
          const cells: MinimapCell[] = [];
          for (let at = 0; at < l.length; at += group) {
            const bucket = l.slice(at, at + group);
            cells.push(bucket.every(isSpace) ? { blank: true } : { tone: bucket.map(toneOf).find(Boolean) });
          }
          return cells;
        }),
    };
  });
}
