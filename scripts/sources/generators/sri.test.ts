import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSri } from '../parsers/sri';
import { verifyProvenance, withProvenance } from '../lib/provenance';
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
  const doc = withProvenance(parseSri(FIXTURE), provenance);

  it('keeps the document id the generator declares, and derives the file name from it', () => {
    expect(doc.id).toBe('rigveda-khila-sri');
    expect(generator.id).toBe(doc.id);
    expect(`${doc.id}.json`).toBe('rigveda-khila-sri.json');
  });

  it('attaches provenance that verifies against the document content', () => {
    expect(doc.metadata.provenance?.parser).toBe('sri@1');
    expect(doc.metadata.provenance?.upstreamUrl).toBe(provenance.upstreamUrl);
    expect(doc.metadata.provenance?.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(verifyProvenance(doc)).toBe(true);
  });

  it('keeps the licence in step with provenance and the source in draft', () => {
    expect(doc.metadata.status).toBe('draft');
    expect(doc.metadata.license).toBe(doc.metadata.provenance?.license);
  });

  it('leaks no heading, phalaśruti label, colophon or encoder credits', () => {
    const text = doc.sections.flatMap((s) => s.chunks).map((c) => c.sanskrit).join(' ');
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
