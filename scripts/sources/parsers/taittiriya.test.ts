import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseTaittiriya } from './taittiriya';

const FIXTURE = readFileSync(join(import.meta.dir, 'fixtures', 'taittiriya-samhita.html'), 'utf8');

describe('parseTaittiriya', () => {
  const doc = parseTaittiriya(
    [
      { prashna: 5, html: FIXTURE },
      { prashna: 6, html: FIXTURE },
    ],
    4,
  );

  it('is one kāṇḍa document with the source metadata', () => {
    expect(doc.id).toBe('taittiriya-samhita-4');
    expect(doc.metadata.source).toContain('taittiriya.com');
    expect(doc.metadata.license).toContain('taittiriya.com');
    expect(doc.metadata.status).toBe('draft');
  });

  it('numbers sections in reading order across prashnas and skips anuvākas with no pañcāśat text', () => {
    expect(doc.sections.map((s) => s.sectionNumber)).toEqual([1, 2, 3, 4]);
    expect(doc.sections.map((s) => s.id)).toEqual([
      'taittiriya-samhita-4-5-1',
      'taittiriya-samhita-4-5-3',
      'taittiriya-samhita-4-6-1',
      'taittiriya-samhita-4-6-3',
    ]);
  });

  it('splits at daṇḍas, drops the nested reading span, and marks the first pada with its anuvāka', () => {
    const chunks = doc.sections[0].chunks;
    expect(chunks.map((c) => c.id)).toEqual(['ts-4-5-1-1', 'ts-4-5-1-2', 'ts-4-5-1-3']);
    expect(chunks[0].section).toBe(1);
    expect(chunks[1].section).toBeUndefined();
    expect(chunks[2].sanskrit.startsWith('यामिषु॑ङ्गिरिशन्त॒ हस्ते॒ ये चे॒माꣳ')).toBe(true);
    expect(chunks.some((c) => c.sanskrit.includes('(हस्ते'))).toBe(false);
  });

  it('keeps the ꣳ sign and decodes entities', () => {
    const text = doc.sections[0].chunks.map((c) => c.sanskrit).join(' ');
    expect(text).toContain('चे॒माꣳ');
    expect(text).toContain('दि॒क्षु॒&');
  });

  it('throws when no page has text', () => {
    expect(() => parseTaittiriya([{ prashna: 1, html: '<p>none</p>' }], 4)).toThrow();
  });
});
