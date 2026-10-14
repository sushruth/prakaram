/**
 * Generator contract: a module under `scripts/sources/generators/` default-exports
 * `{ id: string; generate(): Promise<ManifestEntry[]> }`. `generate()` fetches its upstream, parses,
 * builds the document's index + part files under `sources/<docId>/` and returns the manifest entries.
 * It never writes `manifest.json` — `scripts/sources/refresh.ts` owns that — so any two generators can
 * run at once without racing. A module is directly runnable
 * (`bun scripts/sources/generators/rigveda.ts`) and writes only its own files.
 */
import type { MantraDocument, SourceProvenance } from '../../../src/types/mantra';
import { join } from 'node:path';
import { parseRigvedaMandala, type RigvedaRecord } from '../parsers/rigveda';
import { getJson } from '../lib/fetch';
import { buildSource, writeSource } from '../lib/parts';
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

/** Parse one maṇḍala into a raw document (no provenance; the index carries it); no fetch, no write. */
export function buildRigvedaDocument(records: RigvedaRecord[], m: number): MantraDocument {
  return parseRigvedaMandala(records, m);
}

/** The provenance for maṇḍala `m`, whose licence comes from the parsed document. */
export function rigvedaProvenance(m: number, license: string, retrievedAt: string): Omit<SourceProvenance, 'sha256'> {
  return {
    upstreamUrl: upstreamUrl(m),
    upstreamRef: COMMIT,
    retrievedAt,
    parser: PARSER,
    license,
    attribution: `Ṛgveda, maṇḍala ${m} — DharmicData (ODbL)`,
  };
}

/** One entry per maṇḍala; a maṇḍala that fails to fetch or parse is logged and skipped. */
async function generate(): Promise<ManifestEntry[]> {
  const retrievedAt = new Date().toISOString().slice(0, 10);
  const entries: ManifestEntry[] = [];
  for (const m of MANDALAS) {
    try {
      const records = await getJson<RigvedaRecord[]>(upstreamUrl(m));
      const doc = buildRigvedaDocument(records, m);
      const license = doc.metadata.license;
      if (!license) throw new Error(`Rigveda maṇḍala ${m} has no licence`);
      const entry = writeSource(SOURCES_DIR, buildSource(doc, rigvedaProvenance(m, license, retrievedAt)));
      entries.push(entry);
      console.log(`[${ID}] wrote ${entry.index} + ${entry.parts.length} part(s)`);
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
