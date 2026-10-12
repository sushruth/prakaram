import { describe, expect, it } from 'bun:test';
import { ALL_SUKTAMS } from '../data';
import { formatNirdesa, lineOf, nirdesaOfChunk, normaliseNirdesa, parseNirdesa, partLabel, rangeNirdesa, rangeWords, resolveNirdesa } from './nirdesa';

const ns = 'rudram-namakam';
const err = (a: string) => {
  const r = resolveNirdesa(a);
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

  it('describes the part', () => {
    expect(partLabel(parseNirdesa('ns/3.2-9')!)).toBe('§3.2-§3.9');
    expect(partLabel(parseNirdesa('ns')!)).toBe('');
    expect(rangeWords(parseNirdesa('ns/3.2-9')!)).toBe('lines 2–9');
    expect(rangeWords(parseNirdesa('ns/3.2')!)).toBe('line 2');
    expect(rangeWords(parseNirdesa('ns/3.2-4.5')!)).toBe('§3.2–§4.5');
    expect(rangeWords(parseNirdesa('ns/3')!)).toBe('');
  });

  it('builds a range from two positions in either order', () => {
    expect(rangeNirdesa('ns', { section: 3, line: 9 }, { section: 3, line: 2 })).toBe('ns/3.2-9');
    expect(rangeNirdesa('ns', { section: 3, line: 2 })).toBe('ns/3.2');
    expect(rangeNirdesa('ns', { section: 4, line: 1 }, { section: 3, line: 2 })).toBe('ns/3.2-4.1');
  });
});

describe('resolve', () => {
  it('slices lines inside a section and across sections', () => {
    const s3 = ALL_SUKTAMS.find((d) => d.id === ns)!.sections[2];
    const r = resolveNirdesa(`${ns}/3.2-9`);
    expect(r.ok && r.chunks.map((c) => c.id)).toEqual(s3.chunks.slice(1, 9).map((c) => c.id));
    const x = resolveNirdesa(`${ns}/2.14-3.2`);
    const s2 = ALL_SUKTAMS.find((d) => d.id === ns)!.sections[1];
    expect(x.ok && x.chunks.map((c) => c.id)).toEqual([...s2.chunks.slice(13), ...s3.chunks.slice(0, 2)].map((c) => c.id));
    expect(x.ok && [x.first, x.last]).toEqual([{ section: 2, line: 14 }, { section: 3, line: 2 }]);
  });

  it('labels with the citation prefix when the source has one', () => {
    const r = resolveNirdesa(`${ns}/3.2-3.9`);
    expect(r.ok && r.label.text).toBe('TS 4.5 §3.2-§3.9');
    const p = resolveNirdesa('sri-suktam');
    expect(p.ok && p.label.text).toBe('sri-suktam');
  });

  it('reports each error', () => {
    expect(err('nope/1')).toEqual({ kind: 'unknown-source', source: 'nope' });
    expect(err(`${ns}/99`)).toEqual({ kind: 'unknown-section', section: 99 });
    expect(err(`${ns}/3.2-99.1`)).toEqual({ kind: 'unknown-section', section: 99 });
    expect(err(`${ns}/3.999`)).toMatchObject({ kind: 'line-out-of-range', section: 3, line: 999 });
    expect(err(`${ns}/3.2-3.999`)).toMatchObject({ kind: 'line-out-of-range', line: 999 });
    expect(err(`${ns}/3.9-3.2`)).toEqual({ kind: 'reversed-range' });
    expect(err(`${ns}/4.1-3.2`)).toEqual({ kind: 'reversed-range' });
    expect(err('ns//')).toEqual({ kind: 'syntax' });
    expect(err(`${ns}/x`)).toEqual({ kind: 'syntax' });
  });

  it('addresses a chunk, whatever its id looks like', () => {
    const doc = { ...ALL_SUKTAMS[0], sections: [{ id: 'q', title: 't', sectionNumber: 1, chunks: [{ id: 'zz', chunkNumber: 40, sanskrit: 'अ' }, { id: 'a/b c', chunkNumber: 7, sanskrit: 'ब' }] }] };
    expect(lineOf(doc, 'a/b c')).toEqual({ section: 1, line: 2 });
    expect(nirdesaOfChunk(doc, 'zz')).toBe(`${doc.id}/1.1`);
    expect(nirdesaOfChunk(doc, 'missing')).toBeUndefined();
  });
});

describe('corpus', () => {
  it('has unique ids, consecutive section numbers and no empty section', () => {
    expect(new Set(ALL_SUKTAMS.map((d) => d.id)).size).toBe(ALL_SUKTAMS.length);
    for (const d of ALL_SUKTAMS) {
      expect(d.sections.map((s) => s.sectionNumber)).toEqual(d.sections.map((_, i) => i + 1));
      expect(new Set(d.sections.map((s) => s.id)).size).toBe(d.sections.length);
      const ids = d.sections.flatMap((s) => s.chunks.map((c) => c.id));
      expect(new Set(ids).size).toBe(ids.length);
      for (const s of d.sections) expect(s.chunks.length).toBeGreaterThan(0);
    }
  });

  it('resolves whole, section, first line and last line of every document', () => {
    for (const d of ALL_SUKTAMS) {
      const all = d.sections.flatMap((s) => s.chunks);
      const whole = resolveNirdesa(d.id);
      expect(whole.ok && whole.chunks.length).toBe(all.length);
      for (const s of d.sections) {
        const sec = resolveNirdesa(`${d.id}/${s.sectionNumber}`);
        expect(sec.ok && sec.chunks).toEqual(s.chunks);
        const first = resolveNirdesa(`${d.id}/${s.sectionNumber}.1`);
        expect(first.ok && first.chunks).toEqual([s.chunks[0]]);
        const last = resolveNirdesa(`${d.id}/${s.sectionNumber}.${s.chunks.length}`);
        expect(last.ok && last.chunks).toEqual([s.chunks[s.chunks.length - 1]]);
        expect(nirdesaOfChunk(d, s.chunks[0].id)).toBe(`${d.id}/${s.sectionNumber}.1`);
      }
      const n = d.sections.length;
      const span = resolveNirdesa(`${d.id}/1.1-${n}.${d.sections[n - 1].chunks.length}`);
      expect(span.ok && span.chunks.length).toBe(all.length);
    }
  });
});
