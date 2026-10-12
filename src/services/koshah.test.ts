import { describe, expect, it } from 'bun:test';
import { findPiece, listPieces, pieceAsPrakara, pieceChunks, searchPieces } from './koshah';
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
    expect(p.items[0].sectionId).toBe('many-2');
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
