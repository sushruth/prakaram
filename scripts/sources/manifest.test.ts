import { describe, expect, it } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { VENDORED_SOURCES } from '../../src/data/vendoredSources';
import type { MantraDocument } from '../../src/types/mantra';
import { verifyProvenance } from './lib/provenance';

/**
 * Guards `sources/manifest.json` against the vendored table and the files on disk (see
 * sources/README.md). Skipped when the manifest is absent, so a fresh clone that has not run
 * `bun run sources:refresh` still passes. No network: it reads only the checked-in files.
 */
const SOURCES_DIR = join(import.meta.dir, '../../sources');
const MANIFEST_PATH = join(SOURCES_DIR, 'manifest.json');
const HAS_MANIFEST = existsSync(MANIFEST_PATH);

interface ManifestEntry {
  id: string;
  file: string;
  sha256: string;
}
interface Manifest {
  sources: ManifestEntry[];
}

const readManifest = (): Manifest => JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;

describe('sources/manifest.json', () => {
  it.skipIf(!HAS_MANIFEST)('indexes exactly the vendored sources, one file each', () => {
    const manifest = readManifest();
    const expected = new Map(VENDORED_SOURCES.map((s) => [s.id, s.file]));
    const actual = new Map(manifest.sources.map((s) => [s.id, s.file]));
    expect(actual.size).toBe(manifest.sources.length); // no duplicate ids
    expect([...actual.keys()].sort()).toEqual([...expected.keys()].sort());
    for (const [id, file] of actual) expect(file).toBe(expected.get(id));
  });

  it.skipIf(!HAS_MANIFEST)('lists the sha256 on disk and every file verifies', () => {
    for (const entry of readManifest().sources) {
      const doc = JSON.parse(readFileSync(join(SOURCES_DIR, entry.file), 'utf8')) as MantraDocument;
      expect(entry.sha256).toBe(doc.metadata.provenance?.sha256);
      expect(verifyProvenance(doc)).toBe(true);
    }
  });
});
