import type { MantraChunk, MantraDocument, SuktaSection } from '../types/mantra';
import { ALL_SUKTAMS } from '../data';
import { padyas } from './padya';

/**
 * Nirdeśa (निर्देश): the address of a source, a section, a pada, a padya or a range.
 *   `<source>`  `<source>/<s>`  `<source>/<s>.<l>`  `<source>/<s>.<from>-<to>`  `<source>/<s1>.<l1>-<s2>.<l2>`
 *   padya step: `<source>/<s>.p<n>`  `<s>.p<n>-p<m>`  `<s1>.p<n>-<s2>.p<m>`  `<s>.p<n>.<k>`  `<s>.p<n>.<a>-<b>`
 * `s` is the section's `sectionNumber`, `l` the 1-based pada (line, a chunk) inside that section, `p<n>` the padya
 * with the number printed at its end (only sections with a padya level, see padya.ts). In `p<n>.<k>` the pada is
 * counted inside that padya. Ranges are whole padas. Not a traditional mantra number.
 */
export interface Pos {
  section: number;
  pada: number;
}
/** A padya-step address: padya `n` of the section, optionally narrowed to padas `pada..toPada` inside it, or ranged to padya `to`. */
export interface PadyaRef {
  n: number;
  pada?: number;
  toPada?: number;
  to?: { section: number; n: number };
}
export interface Nirdesa {
  source: string;
  section?: number;
  pada?: number;
  /** End of a range (inclusive); present only for a range of two or more padas. */
  to?: Pos;
  /** Set for a padya-step address (then `pada` and `to` are unused). */
  padya?: PadyaRef;
}

export type NirdesaError =
  | { kind: 'syntax' }
  | { kind: 'unknown-source'; source: string }
  | { kind: 'unknown-section'; section: number }
  | { kind: 'pada-out-of-range'; section: number; pada: number; max: number }
  | { kind: 'no-padya-level'; section: number }
  | { kind: 'padya-not-found'; section: number; padya: number }
  | { kind: 'reversed-range' };

export interface Resolved {
  nirdesa: Nirdesa;
  document: MantraDocument;
  /** The sections the address touches (the whole of them for a section or source). */
  sections: SuktaSection[];
  /** The addressed padas, in order. */
  chunks: MantraChunk[];
  /** First and last addressed pada; a source or section covers all its padas. */
  first: Pos;
  last: Pos;
  /** Display parts: the title and the part in words ('§3 padas 2–9'), or the id for a whole source. */
  label: { title: MantraDocument['title']; text: string };
}
export type Resolution = ({ ok: true } & Resolved) | { ok: false; error: NirdesaError };

const N = '[1-9]\\d*';
const TAIL = new RegExp(`^(${N})(?:\\.(${N})(?:-(?:(${N})\\.)?(${N}))?)?$`);
const PTAIL = new RegExp(`^(${N})\\.p(${N})(?:-(?:(${N})\\.)?p(${N})|\\.(${N})(?:-(${N}))?)?$`);

export function parseNirdesa(s: string): Nirdesa | null {
  const i = s.indexOf('/');
  const source = i < 0 ? s : s.slice(0, i);
  if (!source || /\s/.test(source)) return null;
  if (i < 0) return { source };
  const rest = s.slice(i + 1);
  const pm = rest.match(PTAIL);
  if (pm) {
    const [section, n, toSection, toN, pada, toPada] = [pm[1], pm[2], pm[3], pm[4], pm[5], pm[6]].map((x) => (x === undefined ? undefined : Number(x)));
    const padya: PadyaRef = { n: n! };
    if (toN && (toSection ?? section) !== section) padya.to = { section: toSection!, n: toN };
    else if (toN && toN !== n) padya.to = { section: section!, n: toN };
    if (pada) {
      padya.pada = pada;
      if (toPada && toPada !== pada) padya.toPada = toPada;
    }
    return { source, section: section!, padya };
  }
  const m = rest.match(TAIL);
  if (!m) return null;
  const [section, pada, toSection, toPada] = [m[1], m[2], m[3], m[4]].map((x) => (x === undefined ? undefined : Number(x)));
  const n: Nirdesa = { source, section: section!, ...(pada ? { pada } : {}) };
  if (toPada) {
    const to = { section: toSection ?? section!, pada: toPada };
    if (to.section !== section || to.pada !== pada) n.to = to;
  }
  return n;
}

/** The canonical string: a range inside one section is `s.a-b`, across sections `s1.a-s2.b`; `s.3-3` is `s.3`. Padya forms keep their `p`. */
export function formatNirdesa(n: Nirdesa): string {
  if (n.section === undefined) return n.source;
  if (n.padya) {
    const p = n.padya;
    const head = `${n.source}/${n.section}.p${p.n}`;
    if (p.pada !== undefined) return `${head}.${p.pada}${p.toPada ? `-${p.toPada}` : ''}`;
    return p.to ? `${head}-${p.to.section === n.section ? '' : `${p.to.section}.`}p${p.to.n}` : head;
  }
  if (n.pada === undefined) return `${n.source}/${n.section}`;
  if (!n.to) return `${n.source}/${n.section}.${n.pada}`;
  const end = n.to.section === n.section ? `${n.to.pada}` : `${n.to.section}.${n.to.pada}`;
  return `${n.source}/${n.section}.${n.pada}-${end}`;
}

/** Canonical form of a well-formed string, or undefined. Does not check the corpus. */
export const normaliseNirdesa = (s: string): string | undefined => {
  const n = parseNirdesa(s.trim());
  return n ? formatNirdesa(n) : undefined;
};

const dash = '–';

/** True when the address ranges over two sections. */
const crossSection = (n: Nirdesa) => (n.padya ? !!n.padya.to && n.padya.to.section !== n.section : !!n.to && n.to.section !== n.section);

/**
 * Words for the part inside a section: 'pada 3', 'padas 3–9', 'ṛk 2', 'ṛks 2–4', 'ṛk 2 pada 4', or '' for a whole
 * source or section. Across sections it carries the section marks: '§3 pada 2 – §4 pada 5'.
 */
export function rangeWords(n: Nirdesa): string {
  if (n.padya) {
    const p = n.padya;
    if (p.to) return p.to.section === n.section ? `ṛks ${p.n}${dash}${p.to.n}` : `§${n.section} ṛk ${p.n} ${dash} §${p.to.section} ṛk ${p.to.n}`;
    if (p.pada === undefined) return `ṛk ${p.n}`;
    return `ṛk ${p.n} ${p.toPada ? `padas ${p.pada}${dash}${p.toPada}` : `pada ${p.pada}`}`;
  }
  if (n.pada === undefined) return '';
  if (!n.to) return `pada ${n.pada}`;
  return n.to.section === n.section ? `padas ${n.pada}${dash}${n.to.pada}` : `§${n.section} pada ${n.pada} ${dash} §${n.to.section} pada ${n.to.pada}`;
}

/** The part of a source in words: '§3', '§3 pada 2', '§3 padas 2–9', '§3 ṛks 2–4'; '' for a whole source. */
export function partWords(n: Nirdesa): string {
  if (n.section === undefined) return '';
  if (crossSection(n)) return rangeWords(n);
  return [`§${n.section}`, rangeWords(n)].filter(Boolean).join(' ');
}

const cmp = (a: Pos, b: Pos) => a.section - b.section || a.pada - b.pada;

export function resolveNirdesa(addr: string, docs: MantraDocument[] = ALL_SUKTAMS): Resolution {
  const n = parseNirdesa(addr.trim());
  if (!n) return { ok: false, error: { kind: 'syntax' } };
  const document = docs.find((d) => d.id === n.source);
  if (!document) return { ok: false, error: { kind: 'unknown-source', source: n.source } };
  const secs = document.sections;
  const idx = (num: number) => secs.findIndex((s) => s.sectionNumber === num);
  const bad = (error: NirdesaError) => ({ ok: false as const, error });
  const padaCheck = (p: Pos) => {
    const max = secs[idx(p.section)].chunks.length;
    return p.pada > max ? bad({ kind: 'pada-out-of-range', ...p, max }) : undefined;
  };
  /** Padas of padya `k` in section `num`, or the error. */
  const padya = (num: number, k: number) => {
    const g = padyas(secs[idx(num)]);
    if (!g) return bad({ kind: 'no-padya-level', section: num });
    return g.find((x) => x.number === k) ?? bad({ kind: 'padya-not-found', section: num, padya: k });
  };

  let first: Pos = { section: secs[0].sectionNumber, pada: 1 };
  let last: Pos = { section: secs[secs.length - 1].sectionNumber, pada: secs[secs.length - 1].chunks.length };
  if (n.section !== undefined) {
    if (idx(n.section) < 0) return bad({ kind: 'unknown-section', section: n.section });
    const sec = secs[idx(n.section)];
    first = { section: n.section, pada: 1 };
    last = { section: n.section, pada: sec.chunks.length };
    if (n.padya) {
      const p = n.padya;
      const g = padya(n.section, p.n);
      if ('ok' in g) return g;
      if (p.pada !== undefined) {
        const max = g.to - g.from + 1;
        for (const k of [p.pada, p.toPada ?? p.pada]) if (k > max) return bad({ kind: 'pada-out-of-range', section: n.section, pada: k, max });
        if (p.toPada !== undefined && p.toPada < p.pada) return bad({ kind: 'reversed-range' });
        first = { section: n.section, pada: g.from + p.pada - 1 };
        last = { section: n.section, pada: g.from + (p.toPada ?? p.pada) - 1 };
      } else {
        first = { section: n.section, pada: g.from };
        last = { section: n.section, pada: g.to };
        if (p.to) {
          if (idx(p.to.section) < 0) return bad({ kind: 'unknown-section', section: p.to.section });
          const g2 = padya(p.to.section, p.to.n);
          if ('ok' in g2) return g2;
          if (cmp(first, { section: p.to.section, pada: g2.from }) > 0) return bad({ kind: 'reversed-range' });
          last = { section: p.to.section, pada: g2.to };
        }
      }
    } else if (n.pada !== undefined) {
      first = { section: n.section, pada: n.pada };
      last = first;
      const err = padaCheck(first);
      if (err) return err;
      if (n.to) {
        if (idx(n.to.section) < 0) return bad({ kind: 'unknown-section', section: n.to.section });
        if (cmp(first, n.to) > 0) return bad({ kind: 'reversed-range' });
        const e2 = padaCheck(n.to);
        if (e2) return e2;
        last = n.to;
      }
    }
  }
  const sections = secs.slice(idx(first.section), idx(last.section) + 1);
  const chunks = sections.flatMap((s, i) => {
    const lo = i === 0 ? first.pada - 1 : 0;
    const hi = i === sections.length - 1 ? last.pada : s.chunks.length;
    return s.chunks.slice(lo, hi);
  });
  return {
    ok: true,
    nirdesa: n,
    document,
    sections,
    chunks,
    first,
    last,
    label: { title: document.title, text: partWords(n) || document.id },
  };
}

/** Where a chunk sits in a document: section number and 1-based pada. Independent of the chunk id's format. */
export function padaOf(doc: MantraDocument, chunkId: string): Pos | undefined {
  for (const s of doc.sections) {
    const i = s.chunks.findIndex((c) => c.id === chunkId);
    if (i >= 0) return { section: s.sectionNumber, pada: i + 1 };
  }
  return undefined;
}

export function nirdesaOfChunk(doc: MantraDocument, chunkId: string): string | undefined {
  const p = padaOf(doc, chunkId);
  return p && formatNirdesa({ source: doc.id, ...p });
}

/** Builds the address of the padas between two positions (either order) of one source. */
export function rangeNirdesa(source: string, x: Pos, y: Pos = x): string {
  const [a, b] = cmp(x, y) <= 0 ? [x, y] : [y, x];
  return formatNirdesa({ source, ...a, ...(cmp(a, b) ? { to: b } : {}) });
}

/**
 * The address of a selection between two padas (either order). Unless `byPada`, it snaps outward to whole padyas
 * when both ends sit in padyas, and then returns a padya address; otherwise a pada address. `lo` and `hi` are the
 * padas actually covered.
 */
export function selectionNirdesa(doc: MantraDocument, x: Pos, y: Pos, byPada = false): { addr: string; lo: Pos; hi: Pos; padya: boolean } {
  const [a, b] = cmp(x, y) <= 0 ? [x, y] : [y, x];
  const find = (p: Pos) => {
    const sec = doc.sections.find((s) => s.sectionNumber === p.section);
    return sec && padyas(sec)?.find((g) => p.pada >= g.from && p.pada <= g.to);
  };
  const ga = byPada ? undefined : find(a);
  const gb = byPada ? undefined : find(b);
  if (!ga || !gb) return { addr: rangeNirdesa(doc.id, a, b), lo: a, hi: b, padya: false };
  const same = a.section === b.section && ga.number === gb.number;
  const padya: PadyaRef = { n: ga.number, ...(same ? {} : { to: { section: b.section, n: gb.number } }) };
  return {
    addr: formatNirdesa({ source: doc.id, section: a.section, padya }),
    lo: { section: a.section, pada: ga.from },
    hi: { section: b.section, pada: gb.to },
    padya: true,
  };
}
