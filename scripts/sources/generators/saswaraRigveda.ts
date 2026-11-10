/**
 * Generator for Dayananda Aithal's Saswara Rigveda Samhita, read from the `vendor/saswara-rigveda` submodule
 * (`git submodule update --init vendor/saswara-rigveda`). The submodule commit is the upstream ref.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SourceProvenance } from '../../../src/types/mantra';
import { mandalaPath, parseSaswaraRigvedaMandala } from '../parsers/saswaraRigveda';
import { buildSource, writeSource } from '../lib/parts';
import type { ManifestEntry } from '../lib/manifest';

const ID = 'saswara-rigveda';
const PARSER = 'saswara-rigveda@1';
const ROOT = join(import.meta.dir, '../../..');
const SUBMODULE = join(ROOT, 'vendor/saswara-rigveda');
const SOURCES_DIR = join(ROOT, 'sources');
const MANDALAS = Array.from({ length: 10 }, (_, i) => i + 1);
const LICENSE =
  'None stated. Saswara Rigveda Samhita by Dayananda Aithal (https://github.com/daithal/saswara-rigveda) carries no licence; kept draft until permission is confirmed.';

export function saswaraProvenance(m: number, commit: string, retrievedAt: string): Omit<SourceProvenance, 'sha256'> {
  return {
    upstreamUrl: `https://raw.githubusercontent.com/daithal/saswara-rigveda/${commit}/${mandalaPath(m)}`,
    upstreamRef: commit,
    retrievedAt,
    parser: PARSER,
    license: LICENSE,
    attribution: `Ṛgveda, maṇḍala ${m} — Saswara Rigveda Samhita, Dayananda Aithal (https://github.com/daithal/saswara-rigveda), commit ${commit}`,
  };
}

async function generate(): Promise<ManifestEntry[]> {
  const commit = execFileSync('git', ['-C', SUBMODULE, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const retrievedAt = new Date().toISOString().slice(0, 10);
  const entries: ManifestEntry[] = [];
  for (const m of MANDALAS) {
    const parsed = parseSaswaraRigvedaMandala(readFileSync(join(SUBMODULE, mandalaPath(m)), 'utf8'), m);
    const doc = { ...parsed, metadata: { ...parsed.metadata, license: LICENSE, remoteUrl: `https://github.com/daithal/saswara-rigveda/blob/${commit}/${mandalaPath(m)}` } };
    const entry = writeSource(SOURCES_DIR, buildSource(doc, saswaraProvenance(m, commit, retrievedAt)));
    entries.push(entry);
    console.log(`[${ID}] wrote ${entry.index} + ${entry.parts.length} part(s)`);
  }
  return entries;
}

export default { id: ID, generate };

if (import.meta.main) await generate();
