import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildTaittiriyaDocument, taittiriyaFile } from './taittiriya';
import { verifyProvenance } from '../lib/provenance';

const FIXTURE = readFileSync(join(import.meta.dir, 'fixtures', 'taittiriya-kanda-4.wikitext'), 'utf8');

describe('taittiriya generator', () => {
  const doc = buildTaittiriyaDocument(FIXTURE, 4, '2026-10-14');

  it('builds the taittiriya-samhita-4 document and its file name', () => {
    expect(doc.id).toBe('taittiriya-samhita-4');
    expect(taittiriyaFile(4)).toBe('taittiriya-samhita-4.json');
  });

  it('attaches provenance pinned to revid 417990, and keeps the licence and draft status', () => {
    expect(verifyProvenance(doc)).toBe(true);
    const provenance = doc.metadata.provenance!;
    expect(provenance.upstreamUrl).toBe(`https://sa.wikisource.org/w/index.php?title=${encodeURIComponent('तैत्तिरीयसंहिता-१-४')}&oldid=417990`);
    expect(provenance.upstreamRef).toBe('revid 417990');
    expect(provenance.retrievedAt).toBe('2026-10-14');
    expect(provenance.parser).toBe('taittiriya@1');
    expect(provenance.license).toBe(doc.metadata.license);
    expect(provenance.license).toContain('CC BY-SA 4.0');
    expect(doc.metadata.status).toBe('draft');
  });

  it('keeps swara codepoints in the parsed padas', () => {
    const chunks = doc.sections.flatMap((s) => s.chunks);
    expect(chunks.length).toBeGreaterThan(0);
    for (const c of chunks) expect(/[\u0951\u0952\u1CDA]/.test(c.sanskrit)).toBe(true);
  });
});
