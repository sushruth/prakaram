import { describe, expect, it } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SourceIndex } from '../../../src/types/mantra';
import { sha256Hex } from './hash';
import type { ManifestEntry, ManifestMetrics } from './manifest';
import {
  budgetFailures,
  buildManifestMetrics,
  gzipBytes,
  groupSections,
  MAX_PART_GZIP,
  MERGE_FLOOR_GZIP,
  NAMED_WORKS,
  naturalDivisionKey,
  partGzip,
  prapathakaOf,
  type PartSection,
} from './parts';

const SOURCES_DIR = join(import.meta.dir, '../../..', 'sources');
const TS4_INDEX = join(SOURCES_DIR, 'taittiriya-samhita-4', 'index.json');
const HAS_REAL = existsSync(TS4_INDEX);

/** A section stub; `chunks` carries only the fields the size rule sees. */
const section = (sectionNumber: number, id: string, text: string): PartSection => ({
  id,
  sectionNumber,
  title: `Section ${sectionNumber}`,
  chunks: [{ sanskrit: text }],
});

/** Deterministic, poorly-compressible text of about `n` characters. */
function noise(n: number): string {
  let seed = 123456789;
  let out = '';
  for (let i = 0; i < n; i += 1) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    out += String.fromCharCode(33 + (seed % 90));
  }
  return out;
}

/** The real Taittirīya Saṃhitā index + parts, as `sources:refresh` wrote them. */
function realTs4Entry(): ManifestEntry {
  const index = JSON.parse(readFileSync(TS4_INDEX, 'utf8')) as SourceIndex;
  const files = [...new Set(index.sections.map((s) => s.file))];
  const parts = files.map((file) => {
    const text = readFileSync(join(SOURCES_DIR, 'taittiriya-samhita-4', file), 'utf8');
    return { file: `taittiriya-samhita-4/${file}`, sha256: sha256Hex(text), bytes: Buffer.byteLength(text), gzip: gzipBytes(text) };
  });
  const provenance = index.metadata.provenance!;
  return { id: index.id, index: 'taittiriya-samhita-4/index.json', sha256: provenance.sha256, provenance, parts };
}

describe('prapathakaOf / naturalDivisionKey', () => {
  it('reads the prapāṭhaka from a Taittirīya Saṃhitā section id, and nothing from another id', () => {
    expect(prapathakaOf('taittiriya-samhita-4-5-3')).toBe(5);
    expect(prapathakaOf('taittiriya-samhita-4-12-1')).toBe(12);
    expect(prapathakaOf('taittiriya-aranyaka-3-12')).toBeUndefined();
    expect(prapathakaOf('rigveda-2-23')).toBeUndefined();
  });

  it('uses the prapāṭhaka as the Saṃhitā division and the section itself elsewhere', () => {
    expect(naturalDivisionKey('taittiriya-samhita-4', { id: 'taittiriya-samhita-4-5-3', sectionNumber: 50 })).toBe(5);
    expect(naturalDivisionKey('rigveda-2', { id: 'rigveda-2-23', sectionNumber: 23 })).toBe(23);
  });
});

describe('groupSections', () => {
  it('packs small adjacent divisions and keeps every part within the cap', () => {
    const sections = Array.from({ length: 40 }, (_, i) => section(i + 1, `rv-1-${i + 1}`, noise(1500)));
    const parts = groupSections(sections, (s) => s.sectionNumber);
    expect(parts.length).toBeLessThan(sections.length); // some divisions were merged
    for (const part of parts) expect(partGzip(part)).toBeLessThanOrEqual(MAX_PART_GZIP);
  });

  it('keeps a substantial natural division as its own part', () => {
    const big = Array.from({ length: 4 }, (_, i) => section(i + 1, `big-${i + 1}`, noise(9000)));
    expect(partGzip([big[0]])).toBeGreaterThan(MERGE_FLOOR_GZIP);
    const parts = groupSections(big, (s) => s.sectionNumber);
    expect(parts).toHaveLength(4);
  });
});

describe('budget check', () => {
  const provenance = {
    upstreamUrl: 'https://example.test/x',
    upstreamRef: 'x',
    retrievedAt: '2026-10-14',
    parser: 'test@1',
    license: 'CC0',
    attribution: 'Test',
    sha256: '0'.repeat(64),
  };
  const emptyMetrics: ManifestMetrics = { total: { raw: 0, gzip: 0 }, largestPart: null, works: [] };

  it('fails a synthetic part over the cap', () => {
    const entry: ManifestEntry = {
      id: 'x',
      index: 'x/index.json',
      sha256: provenance.sha256,
      provenance,
      parts: [{ file: 'x/part-1.json', sha256: '0'.repeat(64), bytes: MAX_PART_GZIP + 1, gzip: MAX_PART_GZIP + 1 }],
    };
    const failures = budgetFailures([entry], emptyMetrics);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('part over cap');
  });

  it('fails a synthetic work over its budget or part count', () => {
    const metrics: ManifestMetrics = {
      ...emptyMetrics,
      works: [{ id: 'rudram', label: 'Śrī Rudram', parts: 4, gzip: 30_000, budget: 25 * 1024, maxParts: 3, ok: false }],
    };
    expect(budgetFailures([], metrics)).toHaveLength(1);
  });

  it.skipIf(!HAS_REAL)('passes the real Rudram', () => {
    const metrics = buildManifestMetrics([realTs4Entry()], SOURCES_DIR);
    const rudram = metrics.works.find((w) => w.id === NAMED_WORKS[0].id)!;
    expect(rudram.ok).toBe(true);
    expect(rudram.parts).toBeLessThanOrEqual(3);
    expect(rudram.gzip).toBeLessThanOrEqual(25 * 1024);
    expect(budgetFailures([realTs4Entry()], metrics)).toEqual([]);
  });
});

describe('the real Taittirīya Saṃhitā split', () => {
  it.skipIf(!HAS_REAL)('writes one part per prapāṭhaka, each within the cap', () => {
    const entry = realTs4Entry();
    expect(entry.parts).toHaveLength(7);
    for (const part of entry.parts) {
      expect(part.gzip).toBeLessThanOrEqual(MAX_PART_GZIP);
      const sections = (JSON.parse(readFileSync(join(SOURCES_DIR, part.file), 'utf8')) as { sections: { id: string }[] }).sections;
      const prapathakas = new Set(sections.map((s) => prapathakaOf(s.id)));
      expect(prapathakas.size).toBe(1); // a part holds exactly one prapāṭhaka
    }
  });
});
