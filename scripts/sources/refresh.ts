/**
 * The build-time refresh: runs every generator under `generators/`, writes `sources/manifest.json`, and
 * reports and enforces the part-size budgets. Run with `bun run sources:refresh`. A generator writes its own
 * `sources/<docId>/` files and never the manifest, so this is the single writer of the manifest and generators
 * stay parallel-safe. Each written index is read back and its provenance hash re-checked, and every part is
 * re-hashed, before the manifest is written. A part over `MAX_PART_GZIP`, or a named work over its budget,
 * fails the run (exit non-zero) unless `SOURCES_BUDGET_WARN_ONLY=1`. See sources/README.md.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { SourceIndex } from '../../src/types/mantra';
import { writeManifest, type ManifestEntry } from './lib/manifest';
import { budgetFailures, buildManifestMetrics, MAX_PART_GZIP } from './lib/parts';
import { sha256Hex } from './lib/hash';
import { verifyProvenance } from './lib/provenance';

const GENERATORS_DIR = join(import.meta.dir, 'generators');
const SOURCES_DIR = join(import.meta.dir, '..', '..', 'sources');
const WARN_ONLY = process.env.SOURCES_BUDGET_WARN_ONLY === '1';

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

/** Read a written index back and confirm its provenance hash still matches its content. */
function verifyIndex(entry: ManifestEntry): boolean {
  const index = JSON.parse(readFileSync(join(SOURCES_DIR, entry.index), 'utf8')) as SourceIndex;
  return verifyProvenance(index);
}

/** Read a written part back and confirm its manifest sha256 matches its bytes. */
function verifyPart(file: string, sha256: string): boolean {
  return sha256Hex(readFileSync(join(SOURCES_DIR, file), 'utf8')) === sha256;
}

const entries: ManifestEntry[] = [];
const unverified: string[] = [];
for (const generator of await loadGenerators()) {
  const start = Date.now();
  const produced = await generator.generate();
  entries.push(...produced);
  let bytes = 0;
  let verified = 0;
  let totalParts = 0;
  for (const entry of produced) {
    bytes += statSync(join(SOURCES_DIR, entry.index)).size;
    totalParts += entry.parts.length;
    if (verifyIndex(entry)) verified += 1;
    else unverified.push(entry.index);
    for (const part of entry.parts) {
      bytes += part.bytes;
      if (!verifyPart(part.file, part.sha256)) unverified.push(part.file);
    }
  }
  console.log(`${generator.id}: ${produced.length} docs, ${totalParts} parts, ${bytes} bytes, provenance ${verified}/${produced.length} verified (${Date.now() - start}ms)`);
}

const metrics = buildManifestMetrics(entries, SOURCES_DIR);

console.log('\nsources/ size report');
for (const entry of entries) {
  console.log(`  ${entry.id}: ${entry.parts.length} parts`);
  for (const part of entry.parts) console.log(`    ${part.file} ${part.bytes} B raw / ${part.gzip} B gz`);
}
console.log(`  total: ${metrics.total.raw} B raw / ${metrics.total.gzip} B gz`);
if (metrics.largestPart) console.log(`  largest part: ${metrics.largestPart.file} ${metrics.largestPart.gzip} B gz (cap ${MAX_PART_GZIP} B)`);
for (const work of metrics.works) {
  console.log(`${work.id}: ${work.parts} parts, ${(work.gzip / 1024).toFixed(1)} KB gz (budget ${(work.budget / 1024).toFixed(0)} KB, max ${work.maxParts} parts) ${work.ok ? 'PASS' : 'FAIL'}`);
}

const manifest = writeManifest(entries, metrics);
console.log(`\nmanifest.json: ${manifest.sources.length} sources, pin ${manifest.pin}`);

const failures = [...budgetFailures(entries, metrics), ...unverified.map((f) => `unverified: ${f}`)];

if (failures.length) {
  console.error(`\n${WARN_ONLY ? 'WARN (SOURCES_BUDGET_WARN_ONLY=1)' : 'FAIL'}:\n  ${failures.join('\n  ')}`);
  if (!WARN_ONLY) process.exit(1);
}
