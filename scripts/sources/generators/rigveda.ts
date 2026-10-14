/**
 * Generator contract: a module under `scripts/sources/generators/` default-exports
 * `{ id: string; generate(): Promise<ManifestEntry[]> }`. `generate()` fetches its upstream, parses,
 * attaches provenance and writes `sources/<docId>.json` for every document it produces, then returns
 * the manifest entries. It never writes `manifest.json` — `scripts/sources/refresh.ts` owns that — so
 * any two generators can run at once without racing. A module is directly runnable
 * (`bun scripts/sources/generators/rigveda.ts`) and writes only its own files.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MantraDocument } from '../../../src/types/mantra';
import { parseRigvedaMandala, type RigvedaRecord } from '../parsers/rigveda';
import { getJson } from '../lib/fetch';
import { withProvenance } from '../lib/provenance';
import type { ManifestEntry } from '../lib/manifest';

const ID = 'rigveda';
const PARSER = 'rigveda@1';
/** The DharmicData commit the upstream paths are pinned to. */
const COMMIT = '96b3bafd47ffbfe1902f3f0ef7a1928dd43c34d7';
const MANDALAS = Array.from({ length: 10 }, (_, i) => i + 1);
const SOURCES_DIR = join(import.meta.dir, '../../..', 'sources');

/** The pinned jsDelivr URL of one maṇḍala, and the upstream citation it resolves to. */
const upstreamUrl = (m: number): string =>
  `https://cdn.jsdelivr.net/gh/bhavykhatri/DharmicData@${COMMIT}/Rigveda/rigveda_mandala_${m}.json`;

/** The file a maṇḍala is written to. */
export function rigvedaFile(m: number): string {
  return `rigveda-${m}.json`;
}

/** Parse one maṇḍala and attach provenance; no fetch, no write, so a test can run it on a fixture. */
export function buildRigvedaDocument(records: RigvedaRecord[], m: number, retrievedAt: string): MantraDocument {
  const parsed = parseRigvedaMandala(records, m);
  const license = parsed.metadata.license;
  if (!license) throw new Error(`Rigveda maṇḍala ${m} has no licence`);
  return withProvenance(parsed, {
    upstreamUrl: upstreamUrl(m),
    upstreamRef: COMMIT,
    retrievedAt,
    parser: PARSER,
    license,
    attribution: `Ṛgveda, maṇḍala ${m} — DharmicData (ODbL)`,
  });
}

/** One entry per maṇḍala; a maṇḍala that fails to fetch or parse is logged and skipped. */
async function generate(): Promise<ManifestEntry[]> {
  const retrievedAt = new Date().toISOString().slice(0, 10);
  const entries: ManifestEntry[] = [];
  for (const m of MANDALAS) {
    try {
      const records = await getJson<RigvedaRecord[]>(upstreamUrl(m));
      const doc = buildRigvedaDocument(records, m, retrievedAt);
      const file = rigvedaFile(m);
      writeFileSync(join(SOURCES_DIR, file), `${JSON.stringify(doc, null, 2)}\n`);
      const provenance = doc.metadata.provenance!;
      entries.push({ id: doc.id, file, sha256: provenance.sha256, provenance });
      console.log(`[${ID}] wrote ${file}`);
    } catch (err) {
      console.warn(`[${ID}] skipped maṇḍala ${m}: ${(err as Error).message}`);
    }
  }
  return entries;
}

export default { id: ID, generate };

if (import.meta.main) {
  const entries = await generate();
  console.log(`[${ID}] ${entries.length}/${MANDALAS.length} maṇḍalas written`);
}
