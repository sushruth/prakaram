import { CONSONANTS, DECODE_ALIASES, SEPARATOR, SIGNS, SWARA_IAST, SWARAS, VIRAMA, VOWELS } from './iastTables';

/**
 * Lossless storage codec between Devanagari and IAST (AGENTS.md §3.0). `iastToDevanagari(devanagariToIast(s))`
 * returns `s` exactly; the round trip over every vendored source is checked in scripts/sources/iastCodec.test.ts.
 * Where plain IAST would read two ways (क्ह and ख are both "kh", कइ and कै both "kai") the encoder writes
 * SEPARATOR between the two tokens. ASCII digits are wrapped in SEPARATOR, because bare digits stand for
 * Devanagari digits.
 */
type Kind = 'cons' | 'vowel' | 'other';

interface Token {
  kind: Kind;
  deva: string;
  matra?: string;
}

const TOKENS = new Map<string, Token>();
for (const [deva, iast] of CONSONANTS) TOKENS.set(iast, { kind: 'cons', deva });
for (const [deva, matra, iast] of VOWELS) TOKENS.set(iast, { kind: 'vowel', deva, matra });
for (const [deva, iast] of [...SIGNS, ...SWARAS, ...DECODE_ALIASES]) TOKENS.set(iast, { kind: 'other', deva });
const LONGEST = Math.max(...[...TOKENS.keys()].map((k) => k.length));

const ENCODE = new Map<string, string>([...SIGNS, ...SWARAS]);
const CONS = new Map(CONSONANTS);
const INDEPENDENT = new Map(VOWELS.map(([deva, , iast]) => [deva, iast]));
const MATRAS = new Map(VOWELS.filter(([, m]) => m).map(([, matra, iast]) => [matra, iast]));

const isDigit = (c: string | undefined): boolean => c !== undefined && c >= '0' && c <= '9';

/** NFD with each run of combining marks reordered so swara marks come after the letter's own marks. */
function canonical(s: string): string {
  return s.normalize('NFD').replace(/\p{M}+/gu, (run) => {
    const marks = [...run];
    return marks.filter((m) => !SWARA_IAST.has(m)).join('') + marks.filter((m) => SWARA_IAST.has(m)).join('');
  });
}

/** Length of the token at `i` (longest match, case-folded), or of a separator-wrapped ASCII digit run. */
function tokenAt(s: string, i: number): { length: number; token?: Token } {
  if (s[i] === SEPARATOR && isDigit(s[i + 1])) {
    let j = i + 1;
    while (isDigit(s[j])) j++;
    return { length: (s[j] === SEPARATOR ? j + 1 : j) - i };
  }
  for (let len = Math.min(LONGEST, s.length - i); len > 0; len--) {
    const token = TOKENS.get(s.slice(i, i + len).toLowerCase());
    if (token) return { length: len, token };
  }
  return { length: 1 };
}

export function iastToDevanagari(input: string): string {
  const s = canonical(input);
  let out = '';
  let afterConsonant = false;
  for (let i = 0; i < s.length; ) {
    const { length, token } = tokenAt(s, i);
    const text = s.slice(i, i + length);
    i += length;
    if (afterConsonant && token?.kind !== 'vowel') out += VIRAMA;
    if (token?.kind === 'vowel') out += afterConsonant ? token.matra : token.deva;
    else if (token) out += token.deva;
    else if (text[0] === SEPARATOR) out += text.replaceAll(SEPARATOR, '');
    else out += text;
    afterConsonant = token?.kind === 'cons';
  }
  return afterConsonant ? out + VIRAMA : out;
}

interface Piece {
  text: string;
  kind: Kind | 'matra';
}

function encodePieces(s: string): Piece[] {
  const pieces: Piece[] = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const cons = CONS.get(c);
    if (cons !== undefined) {
      pieces.push({ text: cons, kind: 'cons' });
      const next = s[i + 1];
      if (next === VIRAMA) i++;
      else if (MATRAS.has(next)) pieces.push({ text: MATRAS.get(next)!, kind: 'matra' }), i++;
      else pieces.push({ text: 'a', kind: 'matra' });
    } else if (INDEPENDENT.has(c)) pieces.push({ text: INDEPENDENT.get(c)!, kind: 'vowel' });
    else if (ENCODE.has(c)) pieces.push({ text: ENCODE.get(c)!, kind: 'other' });
    else if (isDigit(c)) {
      let j = i;
      while (isDigit(s[j + 1])) j++;
      pieces.push({ text: SEPARATOR + s.slice(i, j + 1) + SEPARATOR, kind: 'other' });
      i = j;
    } else pieces.push({ text: c, kind: 'other' });
  }
  return pieces;
}

const ANUDATTA = '\u0320';

/** Unicode normalisation puts the anudātta (a below mark) before a svarita on the same letter, so a separator keeps ॒॑ apart. */
const reorders = (a: Piece, b: Piece): boolean => b.text === ANUDATTA && a.text !== ANUDATTA && SWARA_IAST.has(a.text);

/** True when `a` then `b` would not read back as the same two tokens. */
const needsSeparator = (a: Piece, b: Piece): boolean =>
  (a.kind === 'cons' && b.kind === 'vowel') || reorders(a, b) || tokenAt(a.text + b.text, 0).length !== a.text.length;

export function devanagariToIast(s: string): string {
  const pieces = encodePieces(s);
  let out = '';
  pieces.forEach((p, i) => {
    if (i > 0 && needsSeparator(pieces[i - 1], p)) out += SEPARATOR;
    out += p.text;
  });
  return out.normalize('NFC');
}
