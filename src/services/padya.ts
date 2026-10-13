import type { SuktaSection } from '../types/mantra';

/** A padya (verse, stanza): padas `from..to` (1-based, inclusive) of a section, under the number printed at its end. */
export interface Padya {
  number: number;
  from: number;
  to: number;
}

// Digit zeros of the scripts we print numerals in (Latin, Devanagari, Tamil, Telugu, Kannada, Malayalam).
const ZEROS = [0x30, 0x966, 0xbe6, 0xc66, 0xce6, 0xd66];
const NUMERAL = /॥\s*(\p{Nd}+)\s*॥\s*$/u;

/** The printed numeral (`॥ १२ ॥`, `॥ 12 ॥`, any script digits) that ends a pada, or undefined. */
export function printedNumeral(sanskrit: string): number | undefined {
  const m = sanskrit.match(NUMERAL);
  if (!m) return undefined;
  let n = 0;
  for (const ch of m[1]) {
    const cp = ch.codePointAt(0)!;
    const z = ZEROS.find((x) => cp >= x && cp <= x + 9);
    if (z === undefined) return undefined;
    n = n * 10 + (cp - z);
  }
  return n;
}

/**
 * The padya level of a section, derived from the printed numerals at the end of padas; nothing is invented.
 * A numeral ends a padya only when the section has two or more of them. One numeral (the anuvāka number of the
 * Namakam or Chamakam) is not a padya number, and a section with none has no padya level (null).
 * A numeral that is not greater than the one before it (a repeat) is not a boundary. Gaps are kept as printed.
 * Padas after the last numeral belong to no padya.
 */
export function padyas(section: SuktaSection): Padya[] | null {
  const out: Padya[] = [];
  let start = 1;
  let last = 0;
  section.chunks.forEach((c, i) => {
    const n = printedNumeral(c.sanskrit);
    if (n === undefined || n <= last) return;
    out.push({ number: n, from: start, to: i + 1 });
    start = i + 2;
    last = n;
  });
  return out.length >= 2 ? out : null;
}
