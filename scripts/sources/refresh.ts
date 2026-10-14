/**
 * The build-time refresh: runs every generator under `generators/` and writes `sources/manifest.json`.
 * Run with `bun run sources:refresh`. A generator writes its own `sources/<docId>.json` files and never
 * the manifest, so this is the single writer of the manifest and generators stay parallel-safe. Each
 * written file is read back and its provenance hash re-checked before the manifest is written. See
 * sources/README.md.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { MantraDocument } from '../../src/types/mantra';
import { writeManifest, type ManifestEntry } from './lib/manifest';
import { verifyProvenance } from './lib/provenance';

const GENERATORS_DIR = join(import.meta.dir, 'generators');
const SOURCES_DIR = join(import.meta.dir, '..', '..', 'sources');

interface Generator {
  id: string;
  generate(): Promise<ManifestEntry[]>;
}

/** Every generator module under `generators/`, in file-name order. */
async function loadGenerators(): Promise<Generator[]> {
  const files = readdirSync(GENERATORS_DIR)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
    .sort();
  const generators: Generator[] = [];
  for (const file of files) {
    const mod = (await import(join(GENERATORS_DIR, file))) as { default?: Generator };
    if (mod.default) generators.push(mod.default);
  }
  return generators;
}

/** Read a written file back and confirm its provenance hash still matches its content. */
function verifyFile(entry: ManifestEntry): boolean {
  const doc = JSON.parse(readFileSync(join(SOURCES_DIR, entry.file), 'utf8')) as MantraDocument;
  return verifyProvenance(doc);
}

const entries: ManifestEntry[] = [];
const unverified: string[] = [];
for (const generator of await loadGenerators()) {
  const start = Date.now();
  const produced = await generator.generate();
  entries.push(...produced);
  let bytes = 0;
  let verified = 0;
  for (const entry of produced) {
    bytes += statSync(join(SOURCES_DIR, entry.file)).size;
    if (verifyFile(entry)) verified += 1;
    else unverified.push(entry.file);
  }
  console.log(`${generator.id}: ${produced.length} docs, ${bytes} bytes, provenance ${verified}/${produced.length} verified (${Date.now() - start}ms)`);
}

const manifest = writeManifest(entries);
console.log(`manifest.json: ${manifest.sources.length} sources, pin ${manifest.pin}`);

if (unverified.length) {
  console.error(`provenance check failed for: ${unverified.join(', ')}`);
  process.exit(1);
}
