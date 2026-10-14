import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SourceProvenance } from '../../../src/types/mantra';

/** One generated source file, as indexed by `sources/manifest.json` (see sources/README.md). */
export interface ManifestEntry {
  id: string;
  file: string;
  sha256: string;
  provenance: SourceProvenance;
}

/** `sources/manifest.json`: the pin the app should use and the per-file provenance. */
export interface Manifest {
  pin: string;
  generatedAt: string;
  sources: ManifestEntry[];
}

const SOURCES_DIR = join(import.meta.dir, '../../..', 'sources');
const MANIFEST_PATH = join(SOURCES_DIR, 'manifest.json');

/** Write `sources/manifest.json` with entries sorted by id. `pin` defaults to `SOURCES_PIN` or `local`. */
export function writeManifest(entries: ManifestEntry[], pin = process.env.SOURCES_PIN ?? 'local'): Manifest {
  const manifest: Manifest = {
    pin,
    generatedAt: new Date().toISOString(),
    sources: [...entries].sort((a, b) => a.id.localeCompare(b.id)),
  };
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

/** Read `sources/manifest.json`. Throws when it does not exist yet. */
export function readManifest(): Manifest {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;
}
