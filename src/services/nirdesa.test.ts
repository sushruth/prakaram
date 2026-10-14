import { describe, expect, it } from 'bun:test';
import type { MantraDocument, SuktaSection } from '../types/mantra';
import { formatNirdesa, nirdesaOfChunk, normaliseNirdesa, padaOf, parseNirdesa, partWords, rangeNirdesa, rangeWords, resolveNirdesa, selectionNirdesa } from './nirdesa';
import { padyas } from './padya';

// Fixtures standing in for the live corpus: nothing is bundled in `src/data` any more, so the integrity
// checks run over these. A section of `count` padas; `numeralOn` lists the 1-based padas that print a verse
// numeral at their end (the padya level is derived from those numerals, never invented).
const section = (docId: string, n: number, count: number, numeralOn: number[] = []): SuktaSection => ({
  id: `${docId}-${n}`,
  title: `Anuvaka ${n}`,
  sectionNumber: n,
  chunks: Array.from({ length: count }, (_, i) => ({
    id: `${docId}-${n}-${i + 1}`,
    chunkNumber: i + 1,
    sanskrit: numeralOn.includes(i + 1) ? `अ ॥ ${numeralOn.indexOf(i + 1) + 1} ॥` : 'अ',
  })),
});

const doc = (id: string, sections: SuktaSection[]): MantraDocument => ({
  id,
  title: { sanskrit: 'सूक्तम्', transliteration: id, english: id },
  metadata: { source: 'test' },
  sections,
});

const ns = 'rudram-namakam';
const sri = 'sri-suktam';
const shanti = 'shanti-mantras';
// Four anuvākas, none printing a verse numeral (like the Namakam, which prints only the anuvāka number).
const nsDoc = doc(ns, [1, 2, 3, 4].map((n) => section(ns, n, 20)));
// One section, sixteen padyas of two padas each.
const sriDoc = doc(sri, [section(sri, 1, 32, [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32])]);
const shantiDoc = doc(shanti, [section(shanti, 1, 3)]);
const docs = [nsDoc, sriDoc, shantiDoc];

const resolve = (a: string) => resolveNirdesa(a, docs);
const err = (a: string) => {
  const r = resolve(a);
  return r.ok ? undefined : r.error;
};

describe('grammar', () => {
  it('round trips every form', () => {
    for (const a of ['ns', 'ns/3', 'ns/3.2', 'ns/3.2-9', 'ns/3.2-4.1']) expect(formatNirdesa(parseNirdesa(a)!)).toBe(a);
  });

  it('normalises equivalent spellings', () => {
    expect(normaliseNirdesa(' ns/3.2-3.9 ')).toBe('ns/3.2-9');
    expect(normaliseNirdesa('ns/3.4-3.4')).toBe('ns/3.4');
    expect(normaliseNirdesa('ns/3.4-4.1')).toBe('ns/3.4-4.1');
  });

  it('rejects malformed addresses', () => {
    for (const a of ['', '/3', 'ns/', 'ns/0', 'ns/03', 'ns/a', 'ns/3.', 'ns/3.0', 'ns/3.2-', 'ns/3-5', 'ns/3.2-3.', 'ns/3.2/4', 'a b/3', 'ns/3.2-4.1-5']) {
      expect(parseNirdesa(a)).toBeNull();
    }
  });

  it('describes the part in words, never dotted', () => {
    expect(partWords(parseNirdesa('ns/3.2-9')!)).toBe('§3 padas 2–9');
    expect(partWords(parseNirdesa('ns')!)).toBe('');
    expect(partWords(parseNirdesa('ns/3')!)).toBe('§3');
    expect(rangeWords(parseNirdesa('ns/3.2-9')!)).toBe('padas 2–9');
    expect(rangeWords(parseNirdesa('ns/3.2')!)).toBe('pada 2');
    expect(rangeWords(parseNirdesa('ns/3.2-4.5')!)).toBe('§3 pada 2 – §4 pada 5');
    expect(rangeWords(parseNirdesa('ns/3')!)).toBe('');
  });

  it('parses and round trips the padya step', () => {
    for (const a of ['ns/3.p2', 'ns/3.p2-p5', 'ns/3.p2-4.p1', 'ns/3.p2.4', 'ns/3.p2.4-6']) expect(formatNirdesa(parseNirdesa(a)!)).toBe(a);
    expect(normaliseNirdesa('ns/3.p2-3.p5')).toBe('ns/3.p2-p5');
    expect(normaliseNirdesa('ns/3.p2-p2')).toBe('ns/3.p2');
    expect(normaliseNirdesa('ns/3.p2.4-4')).toBe('ns/3.p2.4');
    for (const a of ['ns/3.p', 'ns/3.p0', 'ns/3.p2-', 'ns/3.p2-5', 'ns/3.2-p5', 'ns/3.p2.0', 'ns/3.p2-p5-p6', 'ns/3.P2', 'ns/p2']) expect(parseNirdesa(a)).toBeNull();
    expect(partWords(parseNirdesa('ns/3.p2-p4')!)).toBe('§3 ṛks 2–4');
    expect(partWords(parseNirdesa('ns/3.p2')!)).toBe('§3 ṛk 2');
    expect(partWords(parseNirdesa('ns/3.p2.4-6')!)).toBe('§3 ṛk 2 padas 4–6');
    expect(partWords(parseNirdesa('ns/3.p2-4.p1')!)).toBe('§3 ṛk 2 – §4 ṛk 1');
  });

  it('builds a range from two positions in either order', () => {
    expect(rangeNirdesa('ns', { section: 3, pada: 9 }, { section: 3, pada: 2 })).toBe('ns/3.2-9');
    expect(rangeNirdesa('ns', { section: 3, pada: 2 })).toBe('ns/3.2');
    expect(rangeNirdesa('ns', { section: 4, pada: 1 }, { section: 3, pada: 2 })).toBe('ns/3.2-4.1');
  });
});

describe('resolve', () => {
  it('slices lines inside a section and across sections', () => {
    const s3 = nsDoc.sections[2];
    const r = resolve(`${ns}/3.2-9`);
    expect(r.ok && r.chunks.map((c) => c.id)).toEqual(s3.chunks.slice(1, 9).map((c) => c.id));
    const x = resolve(`${ns}/2.14-3.2`);
    const s2 = nsDoc.sections[1];
    expect(x.ok && x.chunks.map((c) => c.id)).toEqual([...s2.chunks.slice(13), ...s3.chunks.slice(0, 2)].map((c) => c.id));
    expect(x.ok && [x.first, x.last]).toEqual([{ section: 2, pada: 14 }, { section: 3, pada: 2 }]);
  });

  it('labels with the part in words', () => {
    const r = resolve(`${ns}/3.2-3.9`);
    expect(r.ok && r.label.text).toBe('§3 padas 2–9');
    const p = resolve(sri);
    expect(p.ok && p.label.text).toBe(sri);
  });

  it('reports each error', () => {
    expect(err('nope/1')).toEqual({ kind: 'unknown-source', source: 'nope' });
    expect(err(`${ns}/99`)).toEqual({ kind: 'unknown-section', section: 99 });
    expect(err(`${ns}/3.2-99.1`)).toEqual({ kind: 'unknown-section', section: 99 });
    expect(err(`${ns}/3.999`)).toMatchObject({ kind: 'pada-out-of-range', section: 3, pada: 999 });
    expect(err(`${ns}/3.2-3.999`)).toMatchObject({ kind: 'pada-out-of-range', pada: 999 });
    expect(err(`${ns}/3.9-3.2`)).toEqual({ kind: 'reversed-range' });
    expect(err(`${ns}/4.1-3.2`)).toEqual({ kind: 'reversed-range' });
    expect(err('ns//')).toEqual({ kind: 'syntax' });
    expect(err(`${ns}/x`)).toEqual({ kind: 'syntax' });
  });

  it('resolves the padya step to whole padas', () => {
    const sec = sriDoc.sections[0];
    const g = padyas(sec)!;
    const at = (n: number) => g.find((x) => x.number === n)!;
    const one = resolve(`${sri}/1.p3`);
    expect(one.ok && one.chunks).toEqual(sec.chunks.slice(at(3).from - 1, at(3).to));
    const rng = resolve(`${sri}/1.p2-p4`);
    expect(rng.ok && rng.chunks).toEqual(sec.chunks.slice(at(2).from - 1, at(4).to));
    expect(rng.ok && [rng.first, rng.last]).toEqual([{ section: 1, pada: at(2).from }, { section: 1, pada: at(4).to }]);
    const k = resolve(`${sri}/1.p3.2`);
    expect(k.ok && k.chunks).toEqual([sec.chunks[at(3).from]]);
    const kr = resolve(`${sri}/1.p3.1-2`);
    expect(kr.ok && kr.chunks).toEqual(sec.chunks.slice(at(3).from - 1, at(3).to));
    const same = resolve(`${sri}/1.p2-p4`);
    expect(same.ok && same.label.text).toBe('§1 ṛks 2–4');
  });

  it('reports padya errors with typed errors', () => {
    expect(err(`${sri}/1.p99`)).toEqual({ kind: 'padya-not-found', section: 1, padya: 99 });
    expect(err(`${sri}/1.p4-p2`)).toEqual({ kind: 'reversed-range' });
    expect(err(`${sri}/1.p3.9`)).toMatchObject({ kind: 'pada-out-of-range', section: 1, pada: 9, max: 2 });
    expect(err(`${sri}/1.p3.2-1`)).toEqual({ kind: 'reversed-range' });
    expect(err(`${sri}/2.p1`)).toEqual({ kind: 'unknown-section', section: 2 });
    expect(err(`${sri}/1.p2-2.p1`)).toEqual({ kind: 'unknown-section', section: 2 });
    // The Namakam section prints one trailing numeral (the anuvāka number): no padya level.
    expect(err(`${ns}/3.p1`)).toEqual({ kind: 'no-padya-level', section: 3 });
    expect(err(`${shanti}/1.p1`)).toEqual({ kind: 'no-padya-level', section: 1 });
  });

  it('snaps a selection to whole padyas, unless refined to padas', () => {
    const a = selectionNirdesa(sriDoc, { section: 1, pada: 3 }, { section: 1, pada: 3 });
    expect(a).toMatchObject({ addr: `${sri}/1.p2`, padya: true, lo: { pada: 3 }, hi: { pada: 4 } });
    expect(selectionNirdesa(sriDoc, { section: 1, pada: 8 }, { section: 1, pada: 3 }).addr).toBe(`${sri}/1.p2-p4`);
    expect(selectionNirdesa(sriDoc, { section: 1, pada: 8 }, { section: 1, pada: 3 }, true)).toMatchObject({ addr: `${sri}/1.3-8`, padya: false });
    expect(selectionNirdesa(nsDoc, { section: 3, pada: 2 }, { section: 3, pada: 9 })).toMatchObject({ addr: `${ns}/3.2-9`, padya: false });
  });

  it('addresses a chunk, whatever its id looks like', () => {
    const chunkDoc: MantraDocument = { ...shantiDoc, sections: [{ id: 'q', title: 't', sectionNumber: 1, chunks: [{ id: 'zz', chunkNumber: 40, sanskrit: 'अ' }, { id: 'a/b c', chunkNumber: 7, sanskrit: 'ब' }] }] };
    expect(padaOf(chunkDoc, 'a/b c')).toEqual({ section: 1, pada: 2 });
    expect(nirdesaOfChunk(chunkDoc, 'zz')).toBe(`${chunkDoc.id}/1.1`);
    expect(nirdesaOfChunk(chunkDoc, 'missing')).toBeUndefined();
  });
});

describe('corpus', () => {
  it('has a padya level exactly where two or more numerals are printed, and it covers padas in order', () => {
    for (const d of docs) {
      for (const s of d.sections) {
        const g = padyas(s);
        const printed = s.chunks.filter((c) => /॥\s*\p{Nd}+\s*॥\s*$/u.test(c.sanskrit)).length;
        expect(g !== null).toBe(printed >= 2);
        if (!g) continue;
        let prev = 0;
        for (const x of g) {
          expect(x.from).toBe(prev + 1);
          expect(x.to).toBeGreaterThanOrEqual(x.from);
          prev = x.to;
          const r = resolveNirdesa(`${d.id}/${s.sectionNumber}.p${x.number}`, docs);
          expect(r.ok && r.chunks).toEqual(s.chunks.slice(x.from - 1, x.to));
        }
        expect(prev).toBeLessThanOrEqual(s.chunks.length);
      }
    }
    expect(padyas(sriDoc.sections[0])!.length).toBe(16);
    for (const d of [nsDoc, shantiDoc]) expect(d.sections.every((s) => padyas(s) === null)).toBe(true);
  });

  it('has unique ids, consecutive section numbers and no empty section', () => {
    expect(new Set(docs.map((d) => d.id)).size).toBe(docs.length);
    for (const d of docs) {
      expect(d.sections.map((s) => s.sectionNumber)).toEqual(d.sections.map((_, i) => i + 1));
      expect(new Set(d.sections.map((s) => s.id)).size).toBe(d.sections.length);
      const ids = d.sections.flatMap((s) => s.chunks.map((c) => c.id));
      expect(new Set(ids).size).toBe(ids.length);
      for (const s of d.sections) expect(s.chunks.length).toBeGreaterThan(0);
    }
  });

  it('resolves whole, section, first line and last line of every document', () => {
    for (const d of docs) {
      const all = d.sections.flatMap((s) => s.chunks);
      const whole = resolveNirdesa(d.id, docs);
      expect(whole.ok && whole.chunks.length).toBe(all.length);
      for (const s of d.sections) {
        const sec = resolveNirdesa(`${d.id}/${s.sectionNumber}`, docs);
        expect(sec.ok && sec.chunks).toEqual(s.chunks);
        const first = resolveNirdesa(`${d.id}/${s.sectionNumber}.1`, docs);
        expect(first.ok && first.chunks).toEqual([s.chunks[0]]);
        const last = resolveNirdesa(`${d.id}/${s.sectionNumber}.${s.chunks.length}`, docs);
        expect(last.ok && last.chunks).toEqual([s.chunks[s.chunks.length - 1]]);
        expect(nirdesaOfChunk(d, s.chunks[0].id)).toBe(`${d.id}/${s.sectionNumber}.1`);
      }
      const n = d.sections.length;
      const span = resolveNirdesa(`${d.id}/1.1-${n}.${d.sections[n - 1].chunks.length}`, docs);
      expect(span.ok && span.chunks.length).toBe(all.length);
    }
  });
});
