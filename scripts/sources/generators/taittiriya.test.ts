import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildTaittiriyaDocument, taittiriyaProvenance } from './taittiriya';
import { buildSource } from '../lib/parts';
import { verifyProvenance } from '../lib/provenance';

const FIXTURE = readFileSync(join(import.meta.dir, 'fixtures', 'taittiriya-kanda-4.wikitext'), 'utf8');

describe('taittiriya generator', () => {
  const doc = buildTaittiriyaDocument(FIXTURE, 4);
  const built = buildSource(doc, taittiriyaProvenance(4, '2026-10-14'));

  it('builds the taittiriya-samhita-4 index and its part files', () => {
    expect(built.index.id).toBe('taittiriya-samhita-4');
    expect(built.parts.length).toBeGreaterThan(0);
    for (const part of built.parts) expect(part.file).toMatch(/^part-\d+\.json$/);
  });

  it('attaches provenance to the index, pinned to revid 417990, and keeps the licence and draft status', () => {
    expect(verifyProvenance(built.index)).toBe(true);
    const provenance = built.index.metadata.provenance!;
    expect(provenance.upstreamUrl).toBe(`https://sa.wikisource.org/w/index.php?title=${encodeURIComponent('तैत्तिरीयसंहिता-१-४')}&oldid=417990`);
    expect(provenance.upstreamRef).toBe('revid 417990');
    expect(provenance.retrievedAt).toBe('2026-10-14');
    expect(provenance.parser).toBe('taittiriya@1');
    expect(built.index.metadata.license).toBe(provenance.license);
    expect(provenance.license).toContain('CC BY-SA 4.0');
    expect(built.index.metadata.status).toBe('draft');
  });

  it('keeps swara codepoints in the parsed padas', () => {
    const chunks = built.parts.flatMap((p) => p.sections.flatMap((s) => s.chunks));
    expect(chunks.length).toBeGreaterThan(0);
    for (const c of chunks) expect(/[\u0951\u0952\u1CDA]/.test(c.sanskrit)).toBe(true);
  });
});
