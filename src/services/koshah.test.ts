import { describe, expect, it } from 'bun:test';
import { findPiece, listPieces, normalizePrakara, pieceAsPrakara, pieceChunks, searchPieces } from './koshah';
import { MantraDocument } from '../types/mantra';

const doc = (id: string, sections: number): MantraDocument => ({
  id,
  title: { sanskrit: 'रुद्रम्', transliteration: 'Rudram', english: 'Hymn to Rudra' },
  metadata: { veda: 'yajurveda', source: 'Test source' },
  sections: Array.from({ length: sections }, (_, i) => ({
    id: `${id}-${i + 1}`,
    title: `Anuvaka ${i + 1}`,
    sectionNumber: i + 1,
    chunks: [{ id: `${id}-${i + 1}-a`, chunkNumber: 1, sanskrit: 'अ' }, { id: `${id}-${i + 1}-b`, chunkNumber: 2, sanskrit: 'ब' }],
  })),
});

describe('koshah', () => {
  const docs = [doc('one', 1), doc('many', 3)];

  it('lists a document, and one piece per section of a multi-section document', () => {
    expect(listPieces(docs).map((p) => p.id)).toEqual(['one', 'many', 'many/1', 'many/2', 'many/3']);
  });

  it('defaults status to draft and counts lines', () => {
    const [one, many] = listPieces(docs);
    expect(one.status).toBe('draft');
    expect(many.lines).toBe(6);
  });

  it('returns only the section for a section piece', () => {
    const piece = findPiece(docs, 'many/2')!;
    expect(pieceChunks(docs, piece).map((c) => c.id)).toEqual(['many-2-a', 'many-2-b']);
  });

  it('turns a piece into a one-item prakara that points at its section', () => {
    const p = pieceAsPrakara(findPiece(docs, 'many/2')!);
    expect(p.id).toBe('piece:many/2');
    expect(p.items).toHaveLength(1);
    expect(p.items[0].nirdesa).toBe('many/2');
  });

  it('returns the same prakara object for a piece every time', () => {
    const piece = findPiece(docs, 'many/2')!;
    expect(pieceAsPrakara(piece)).toBe(pieceAsPrakara(piece));
  });

  it('searches titles and source, ignoring case', () => {
    expect(searchPieces(listPieces(docs), 'HYMN').length).toBe(5);
    expect(searchPieces(listPieces(docs), 'anuvaka 3').map((p) => p.id)).toEqual(['many/3']);
    expect(searchPieces(listPieces(docs), 'nothing')).toEqual([]);
  });
});

describe('normalizePrakara steps', () => {
  const docs = [doc('one', 1), doc('many', 3)];
  const step = (o: object) => ({ id: 's', type: 'sukta_ref', ...o });
  const run = (o: object) => normalizePrakara({ id: 'p', items: [step(o)] }, docs)!.items;

  it('keeps a nirdesa inside its own source', () => {
    expect(run({ suktaId: 'many', nirdesa: 'many/2.1-2' })[0].nirdesa).toBe('many/2.1-2');
  });
  it('never plays another source: a mismatched nirdesa falls back to the whole suktaId', () => {
    const [i] = run({ suktaId: 'many', nirdesa: 'one/1' });
    expect(i.suktaId).toBe('many');
    expect(i.nirdesa).toBeUndefined();
  });
  it('falls back on an unknown section or an out-of-range line', () => {
    expect(run({ suktaId: 'many', nirdesa: 'many/9' })[0].nirdesa).toBeUndefined();
    expect(run({ suktaId: 'many', nirdesa: 'many/1.99' })[0].nirdesa).toBeUndefined();
  });
  it('drops the step when its suktaId does not exist either', () => {
    expect(run({ suktaId: 'gone', nirdesa: 'gone/1' })).toEqual([]);
  });
  it('still migrates an old sectionId', () => {
    expect(run({ suktaId: 'many', sectionId: 'many-2' })[0].nirdesa).toBe('many/2');
  });
});
