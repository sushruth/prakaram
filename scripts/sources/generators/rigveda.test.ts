import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildRigvedaDocument, rigvedaProvenance } from './rigveda';
import { buildSource } from '../lib/parts';
import { verifyProvenance } from '../lib/provenance';
import type { RigvedaRecord } from '../parsers/rigveda';

const FIXTURE = JSON.parse(readFileSync(join(import.meta.dir, 'fixtures', 'rigveda-mandala-1.json'), 'utf8')) as RigvedaRecord[];

describe('rigveda generator', () => {
  const doc = buildRigvedaDocument(FIXTURE, 1);
  const built = buildSource(doc, rigvedaProvenance(1, '2026-10-14'));

  it('builds the rigveda-1 index and its part files', () => {
    expect(built.index.id).toBe('rigveda-1');
    expect(built.parts.length).toBeGreaterThan(0);
  });

  it('attaches provenance to the index, pinned to the upstream commit, and keeps the licence and draft status', () => {
    expect(verifyProvenance(built.index)).toBe(true);
    const provenance = built.index.metadata.provenance!;
    expect(provenance.upstreamUrl).toBe('https://cdn.jsdelivr.net/gh/bhavykhatri/DharmicData@96b3bafd47ffbfe1902f3f0ef7a1928dd43c34d7/Rigveda/rigveda_mandala_1.json');
    expect(provenance.upstreamRef).toBe('96b3bafd47ffbfe1902f3f0ef7a1928dd43c34d7');
    expect(provenance.retrievedAt).toBe('2026-10-14');
    expect(provenance.parser).toBe('rigveda@1');
    expect(built.index.metadata.license).toBe(provenance.license);
    expect(provenance.license).toContain('Open Database License (ODbL)');
    expect(built.index.metadata.status).toBe('draft');
  });

  it('keeps swara codepoints in the parsed padas', () => {
    const chunks = built.parts.flatMap((p) => p.sections.flatMap((s) => s.chunks));
    expect(chunks.length).toBeGreaterThan(0);
    for (const c of chunks) expect(/[\u0951\u0952\u1CDA]/.test(c.sanskrit)).toBe(true);
  });
});
