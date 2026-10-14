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
/**
 * The ODbL 1.0 licence string for the DharmicData-derived files, verbatim from
 * docs/licence-compliance.md §2.1. It carries the ODbL §4.3 "Contains information from …" notice and the
 * licence URI, and is set on `metadata.license` too so that it stays equal to `provenance.license`.
 */
const LICENSE =
  'ODbL 1.0 — Contains information from DharmicData (https://github.com/bhavykhatri/DharmicData), which is made available here under the Open Database License (ODbL). Licence text: https://opendatacommons.org/licenses/odbl/1-0/';
const MANDALAS = Array.from({ length: 10 }, (_, i) => i + 1);
const SOURCES_DIR = join(import.meta.dir, '../../..', 'sources');

/** The pinned jsDelivr URL of one maṇḍala, and the upstream citation it resolves to. */
const upstreamUrl = (m: number): string =>
  `https://cdn.jsdelivr.net/gh/bhavykhatri/DharmicData@${COMMIT}/Rigveda/rigveda_mandala_${m}.json`;

/** Parse one maṇḍala into a raw document (no provenance; the index carries it); no fetch, no write. */
export function buildRigvedaDocument(records: RigvedaRecord[], m: number): MantraDocument {
  const parsed = parseRigvedaMandala(records, m);
  return { ...parsed, metadata: { ...parsed.metadata, license: LICENSE } };
}

/** The provenance for maṇḍala `m`: the ODbL 1.0 licence and its per-maṇḍala attribution (docs §2.1). */
export function rigvedaProvenance(m: number, retrievedAt: string): Omit<SourceProvenance, 'sha256'> {
  return {
    upstreamUrl: upstreamUrl(m),
    upstreamRef: COMMIT,
    retrievedAt,
    parser: PARSER,
    license: LICENSE,
    attribution: `Ṛgveda, maṇḍala ${m} — DharmicData (https://github.com/bhavykhatri/DharmicData), commit ${COMMIT}, ODbL 1.0`,
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
      const entry = writeSource(SOURCES_DIR, buildSource(doc, rigvedaProvenance(m, retrievedAt)));
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
