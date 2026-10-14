import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildRigvedaDocument, rigvedaFile } from './rigveda';
import { verifyProvenance } from '../lib/provenance';
import type { RigvedaRecord } from '../parsers/rigveda';

const FIXTURE = JSON.parse(readFileSync(join(import.meta.dir, 'fixtures', 'rigveda-mandala-1.json'), 'utf8')) as RigvedaRecord[];

describe('rigveda generator', () => {
  const doc = buildRigvedaDocument(FIXTURE, 1, '2026-10-14');

  it('builds the rigveda-1 document and its file name', () => {
    expect(doc.id).toBe('rigveda-1');
    expect(rigvedaFile(1)).toBe('rigveda-1.json');
  });

  it('attaches provenance pinned to the upstream commit, and keeps the licence and draft status', () => {
    expect(verifyProvenance(doc)).toBe(true);
    const provenance = doc.metadata.provenance!;
    expect(provenance.upstreamUrl).toBe('https://cdn.jsdelivr.net/gh/bhavykhatri/DharmicData@96b3bafd47ffbfe1902f3f0ef7a1928dd43c34d7/Rigveda/rigveda_mandala_1.json');
    expect(provenance.upstreamRef).toBe('96b3bafd47ffbfe1902f3f0ef7a1928dd43c34d7');
    expect(provenance.retrievedAt).toBe('2026-10-14');
    expect(provenance.parser).toBe('rigveda@1');
    expect(provenance.license).toBe(doc.metadata.license);
    expect(provenance.license).toContain('Open Database License (ODbL)');
    expect(doc.metadata.status).toBe('draft');
  });

  it('keeps swara codepoints in the parsed padas', () => {
    const chunks = doc.sections.flatMap((s) => s.chunks);
    expect(chunks.length).toBeGreaterThan(0);
    for (const c of chunks) expect(/[\u0951\u0952\u1CDA]/.test(c.sanskrit)).toBe(true);
  });
});
