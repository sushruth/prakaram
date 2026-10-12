import type { MantraChunk, MantraDocument, SuktaSection } from '../types/mantra';
import { ALL_SUKTAMS } from '../data';

/**
 * Nirdeśa (निर्देश): the address of a source, a section, a line or a range of lines.
 *   `<source>`  `<source>/<s>`  `<source>/<s>.<l>`  `<source>/<s>.<from>-<to>`  `<source>/<s1>.<l1>-<s2>.<l2>`
 * `s` is the section's `sectionNumber`, `l` the 1-based line (chunk) inside that section.
 * Not a traditional mantra number: a chunk is a line today.
 */
export interface Pos {
  section: number;
  line: number;
}
export interface Nirdesa {
  source: string;
  section?: number;
  line?: number;
  /** End of a range (inclusive); present only for a range of two or more lines. */
  to?: Pos;
}

export type NirdesaError =
  | { kind: 'syntax' }
  | { kind: 'unknown-source'; source: string }
  | { kind: 'unknown-section'; section: number }
  | { kind: 'line-out-of-range'; section: number; line: number; max: number }
  | { kind: 'reversed-range' };

export interface Resolved {
  nirdesa: Nirdesa;
  document: MantraDocument;
  /** The sections the address touches (the whole of them for a section or source). */
  sections: SuktaSection[];
  /** The addressed lines, in order. */
  chunks: MantraChunk[];
  /** First and last addressed line; a source or section covers all its lines. */
  first: Pos;
  last: Pos;
  /** Display parts: `cite` is the optional traditional prefix, e.g. 'TS 4.5'. */
  label: { title: MantraDocument['title']; cite?: string; text: string };
}
export type Resolution = ({ ok: true } & Resolved) | { ok: false; error: NirdesaError };

const N = '[1-9]\\d*';
const TAIL = new RegExp(`^(${N})(?:\\.(${N})(?:-(?:(${N})\\.)?(${N}))?)?$`);

export function parseNirdesa(s: string): Nirdesa | null {
  const i = s.indexOf('/');
  const source = i < 0 ? s : s.slice(0, i);
  if (!source || /\s/.test(source)) return null;
  if (i < 0) return { source };
  const m = s.slice(i + 1).match(TAIL);
  if (!m) return null;
  const [section, line, toSection, toLine] = [m[1], m[2], m[3], m[4]].map((x) => (x === undefined ? undefined : Number(x)));
  const n: Nirdesa = { source, section: section!, ...(line ? { line } : {}) };
  if (toLine) {
    const to = { section: toSection ?? section!, line: toLine };
    if (to.section !== section || to.line !== line) n.to = to;
  }
  return n;
}

/** The canonical string: a range inside one section is `s.a-b`, across sections `s1.a-s2.b`; `s.3-3` is `s.3`. */
export function formatNirdesa(n: Nirdesa): string {
  if (n.section === undefined) return n.source;
  if (n.line === undefined) return `${n.source}/${n.section}`;
  if (!n.to) return `${n.source}/${n.section}.${n.line}`;
  const end = n.to.section === n.section ? `${n.to.line}` : `${n.to.section}.${n.to.line}`;
  return `${n.source}/${n.section}.${n.line}-${end}`;
}

/** Canonical form of a well-formed string, or undefined. Does not check the corpus. */
export const normaliseNirdesa = (s: string): string | undefined => {
  const n = parseNirdesa(s.trim());
  return n ? formatNirdesa(n) : undefined;
};

/** Human label of the part of a source: '§3', '§3.2', '§3.2-§3.9'. */
export function partLabel(n: Nirdesa): string {
  if (n.section === undefined) return '';
  const at = (s: number, l?: number) => `§${s}${l === undefined ? '' : `.${l}`}`;
  return n.to ? `${at(n.section, n.line)}-${at(n.to.section, n.to.line)}` : at(n.section, n.line);
}

/** Words for an action: 'line 3', 'lines 3–9', '§3.2–§4.5', or '' for a whole source or section. */
export function rangeWords(n: Nirdesa): string {
  if (n.line === undefined) return '';
  if (!n.to) return `line ${n.line}`;
  return n.to.section === n.section ? `lines ${n.line}–${n.to.line}` : `${partLabel(n).replace('-', '–')}`;
}

const cmp = (a: Pos, b: Pos) => a.section - b.section || a.line - b.line;

export function resolveNirdesa(addr: string, docs: MantraDocument[] = ALL_SUKTAMS): Resolution {
  const n = parseNirdesa(addr.trim());
  if (!n) return { ok: false, error: { kind: 'syntax' } };
  const document = docs.find((d) => d.id === n.source);
  if (!document) return { ok: false, error: { kind: 'unknown-source', source: n.source } };
  const secs = document.sections;
  const idx = (num: number) => secs.findIndex((s) => s.sectionNumber === num);
  const bad = (error: NirdesaError) => ({ ok: false as const, error });
  const lineCheck = (p: Pos) => {
    const max = secs[idx(p.section)].chunks.length;
    return p.line > max ? bad({ kind: 'line-out-of-range', ...p, max }) : undefined;
  };

  let a = 0;
  let b = secs.length - 1;
  let from = 1;
  let upto: number | undefined;
  if (n.section !== undefined) {
    a = idx(n.section);
    if (a < 0) return bad({ kind: 'unknown-section', section: n.section });
    b = a;
    if (n.line !== undefined) {
      from = n.line;
      upto = n.line;
      const err = lineCheck({ section: n.section, line: n.line });
      if (err) return err;
      if (n.to) {
        b = idx(n.to.section);
        if (b < 0) return bad({ kind: 'unknown-section', section: n.to.section });
        if (cmp({ section: n.section, line: n.line }, n.to) > 0) return bad({ kind: 'reversed-range' });
        const e2 = lineCheck(n.to);
        if (e2) return e2;
        upto = n.to.line;
      }
    }
  }
  const sections = secs.slice(a, b + 1);
  const chunks = sections.flatMap((s, i) => {
    const lo = i === 0 ? from - 1 : 0;
    const hi = i === sections.length - 1 && upto !== undefined ? upto : s.chunks.length;
    return s.chunks.slice(lo, hi);
  });
  const lastSec = sections[sections.length - 1];
  const cite = document.metadata.cite;
  const part = partLabel(n);
  return {
    ok: true,
    nirdesa: n,
    document,
    sections,
    chunks,
    first: { section: sections[0].sectionNumber, line: from },
    last: { section: lastSec.sectionNumber, line: upto ?? lastSec.chunks.length },
    label: { title: document.title, cite, text: [cite, part].filter(Boolean).join(' ') || document.id },
  };
}

/** Where a chunk sits in a document: section number and 1-based line. Independent of the chunk id's format. */
export function lineOf(doc: MantraDocument, chunkId: string): Pos | undefined {
  for (const s of doc.sections) {
    const i = s.chunks.findIndex((c) => c.id === chunkId);
    if (i >= 0) return { section: s.sectionNumber, line: i + 1 };
  }
  return undefined;
}

export function nirdesaOfChunk(doc: MantraDocument, chunkId: string): string | undefined {
  const p = lineOf(doc, chunkId);
  return p && formatNirdesa({ source: doc.id, ...p });
}

/** Builds the address of the lines between two positions (either order) of one source. */
export function rangeNirdesa(source: string, x: Pos, y: Pos = x): string {
  const [a, b] = cmp(x, y) <= 0 ? [x, y] : [y, x];
  return formatNirdesa({ source, ...a, line: a.line, ...(cmp(a, b) ? { to: b } : {}) });
}
