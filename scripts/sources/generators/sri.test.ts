import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSri } from '../parsers/sri';
import { buildSource } from '../lib/parts';
import { verifyProvenance } from '../lib/provenance';
import generator from './sri';

/** The upstream page, snapshotted; no network is touched in this test. */
const FIXTURE = readFileSync(join(import.meta.dir, '..', 'parsers', 'fixtures', 'sri.html'), 'utf8');

const provenance = {
  upstreamUrl: 'https://sanskritdocuments.org/doc_veda/s-sukta-accent.html',
  upstreamRef: '2026-10-14',
  retrievedAt: '2026-10-14',
  parser: 'sri@1',
  license: 'Text from sanskritdocuments.org; permission not yet confirmed.',
  attribution: 'Śrī Sūkta (Ṛgveda Khila 2.6) — sanskritdocuments.org',
};

describe('sri generator', () => {
  const doc = parseSri(FIXTURE);
  const built = buildSource(doc, provenance);

  it('keeps the document id the generator declares, and derives the index path from it', () => {
    expect(built.index.id).toBe('rigveda-khila-sri');
    expect(generator.id).toBe(built.index.id);
    expect(built.parts.length).toBe(1);
  });

  it('attaches provenance to the index that verifies against its content', () => {
    expect(built.index.metadata.provenance?.parser).toBe('sri@1');
    expect(built.index.metadata.provenance?.upstreamUrl).toBe(provenance.upstreamUrl);
    expect(built.index.metadata.provenance?.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(verifyProvenance(built.index)).toBe(true);
  });

  it('keeps the licence in step with provenance and the source in draft', () => {
    expect(built.index.metadata.status).toBe('draft');
    expect(built.index.metadata.license).toBe(built.index.metadata.provenance?.license);
  });

  it('leaks no heading, phalaśruti label, colophon or encoder credits', () => {
    const text = built.parts.flatMap((p) => p.sections.flatMap((s) => s.chunks)).map((c) => c.sanskrit).join(' ');
    for (const gone of [
      'श्रीसूक्त (ऋग्वेद)',
      'फलश्रुति',
      'श्रीसूक्तोपनिषद्',
      'Encoded and proofread',
      'Avinash Sathaye',
      'Sunder Hattangadi',
    ])
      expect(text).not.toContain(gone);
    // The phalaśruti verses themselves are kept.
    expect(text).toContain('प॒द्मा॒न॒ने');
  });
});
