import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SourceProvenance } from '../../../src/types/mantra';

/** One generated part file, as indexed by `sources/manifest.json` (see sources/README.md). */
export interface ManifestPart {
  /** Path relative to `sources/`, e.g. `taittiriya-samhita-4/part-5.json`. */
  file: string;
  /** sha256 of the written file bytes. */
  sha256: string;
  /** Uncompressed byte size. */
  bytes: number;
  /** Gzipped byte size, the size the reader downloads. */
  gzip: number;
}

/** One generated source: its index document and the parts its sections live in. */
export interface ManifestEntry {
  id: string;
  /** Path to the index document relative to `sources/`, e.g. `taittiriya-samhita-4/index.json`. */
  index: string;
  /** The index's provenance sha256 (the hash of the index with `sha256` blanked). */
  sha256: string;
  provenance: SourceProvenance;
  parts: ManifestPart[];
}

/** A named work's measured size against its budget, computed from the parts covering its sections. */
export interface WorkMetric {
  id: string;
  label: string;
  parts: number;
  gzip: number;
  budget: number;
  maxParts: number;
  ok: boolean;
}

/** The size report `sources:refresh` prints and records in the manifest. */
export interface ManifestMetrics {
  total: { raw: number; gzip: number };
  largestPart: { file: string; gzip: number } | null;
  works: WorkMetric[];
}

/** `sources/manifest.json`: the pin the app should use, the per-file provenance and the size report. */
export interface Manifest {
  pin: string;
  generatedAt: string;
  sources: ManifestEntry[];
  metrics: ManifestMetrics;
}

const SOURCES_DIR = join(import.meta.dir, '../../..', 'sources');
const MANIFEST_PATH = join(SOURCES_DIR, 'manifest.json');

/** Write `sources/manifest.json` with entries sorted by id. `pin` defaults to `SOURCES_PIN` or `local`. */
export function writeManifest(entries: ManifestEntry[], metrics: ManifestMetrics, pin = process.env.SOURCES_PIN ?? 'local'): Manifest {
  const manifest: Manifest = {
    pin,
    generatedAt: new Date().toISOString(),
    sources: [...entries].sort((a, b) => a.id.localeCompare(b.id)),
    metrics,
  };
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

/** Read `sources/manifest.json`. Throws when it does not exist yet. */
export function readManifest(): Manifest {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;
}
