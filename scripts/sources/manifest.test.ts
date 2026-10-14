import { describe, expect, it } from 'bun:test';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { VENDORED_SOURCES } from '../../src/data/vendoredSources';
import type { SourceIndex } from '../../src/types/mantra';
import { sha256Hex } from './lib/hash';
import { gzipBytes, MAX_PART_GZIP } from './lib/parts';
import { verifyProvenance } from './lib/provenance';

/**
 * Guards `sources/manifest.json` against the vendored table and the files on disk (see
 * sources/README.md). Skipped when the manifest is absent, so a fresh clone that has not run
 * `bun run sources:refresh` still passes. No network: it reads only the checked-in files.
 */
const SOURCES_DIR = join(import.meta.dir, '../../sources');
const MANIFEST_PATH = join(SOURCES_DIR, 'manifest.json');
const HAS_MANIFEST = existsSync(MANIFEST_PATH);

interface ManifestPart {
  file: string;
  sha256: string;
  bytes: number;
  gzip: number;
}
interface ManifestEntry {
  id: string;
  index: string;
  sha256: string;
  parts: ManifestPart[];
}
interface Manifest {
  sources: ManifestEntry[];
  metrics: { works: { id: string; ok: boolean }[] };
}

const readManifest = (): Manifest => JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;

describe('sources/manifest.json', () => {
  it.skipIf(!HAS_MANIFEST)('indexes exactly the vendored sources, one index each', () => {
    const manifest = readManifest();
    const expected = new Map(VENDORED_SOURCES.map((s) => [s.id, s.index]));
    const actual = new Map(manifest.sources.map((s) => [s.id, s.index]));
    expect(actual.size).toBe(manifest.sources.length); // no duplicate ids
    expect([...actual.keys()].sort()).toEqual([...expected.keys()].sort());
    for (const [id, index] of actual) expect(expected.get(id)).toBe(index);
  });

  it.skipIf(!HAS_MANIFEST)('lists each index sha256 and it verifies against the index content', () => {
    for (const entry of readManifest().sources) {
      const index = JSON.parse(readFileSync(join(SOURCES_DIR, entry.index), 'utf8')) as SourceIndex;
      expect(index.metadata.provenance?.sha256).toBe(entry.sha256);
      expect(verifyProvenance(index)).toBe(true);
    }
  });

  it.skipIf(!HAS_MANIFEST)('lists every part with a matching sha256, size and gzip, within the cap', () => {
    for (const entry of readManifest().sources) {
      expect(entry.parts.length).toBeGreaterThan(0);
      for (const part of entry.parts) {
        const text = readFileSync(join(SOURCES_DIR, part.file), 'utf8');
        expect(part.sha256).toBe(sha256Hex(text));
        expect(part.bytes).toBe(statSync(join(SOURCES_DIR, part.file)).size);
        expect(part.gzip).toBe(gzipBytes(text));
        expect(part.gzip).toBeLessThanOrEqual(MAX_PART_GZIP);
      }
    }
  });

  it.skipIf(!HAS_MANIFEST)('records the named-work budgets, and the Rudram passes', () => {
    const rudram = readManifest().metrics.works.find((w) => w.id === 'rudram');
    expect(rudram?.ok).toBe(true);
  });
});
