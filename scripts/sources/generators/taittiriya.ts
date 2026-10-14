/**
 * Generator contract: a module under `scripts/sources/generators/` default-exports
 * `{ id: string; generate(): Promise<ManifestEntry[]> }`. `generate()` fetches its upstream, parses,
 * attaches provenance and writes `sources/<docId>.json` for every document it produces, then returns
 * the manifest entries. It never writes `manifest.json` — `scripts/sources/refresh.ts` owns that — so
 * any two generators can run at once without racing. A module is directly runnable
 * (`bun scripts/sources/generators/taittiriya.ts`) and writes only its own files.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MantraDocument } from '../../../src/types/mantra';
import { parseTaittiriya } from '../parsers/taittiriya';
import { getJson } from '../lib/fetch';
import { withProvenance } from '../lib/provenance';
import type { ManifestEntry } from '../lib/manifest';

const ID = 'taittiriya-samhita';
const PARSER = 'taittiriya@1';
/** Only kāṇḍa 4 is in the vendored table; its Wikisource revision is pinned. */
const KANDA = 4;
const REVID = 417990;
const PAGE = 'तैत्तिरीयसंहिता-१-४';
const LICENSE = 'CC BY-SA 4.0 — Wikisource contributors, https://creativecommons.org/licenses/by-sa/4.0/';
const SOURCES_DIR = join(import.meta.dir, '../../..', 'sources');

/** The MediaWiki API query for one pinned revision's content. */
const apiUrl = (revid: number): string =>
  `https://sa.wikisource.org/w/api.php?action=query&prop=revisions&rvprop=content|ids&rvslots=main&revids=${revid}&format=json&formatversion=2`;

/** The human-readable Wikisource page at the pinned revision. */
const pageUrl = (revid: number): string =>
  `https://sa.wikisource.org/w/index.php?title=${encodeURIComponent(PAGE)}&oldid=${revid}`;

/** The MediaWiki API response, narrowed to the fields this generator reads. */
interface WikiResponse {
  query: { pages: { revisions: { revid: number; slots: { main: { content: string } } }[] }[] };
}

/** The file kāṇḍa 4 is written to. */
export function taittiriyaFile(kanda: number): string {
  return `taittiriya-samhita-${kanda}.json`;
}

/** The wikitext of the pinned revision, failing loudly if the server serves a different revid. */
export async function fetchRevision(revid: number): Promise<string> {
  const data = await getJson<WikiResponse>(apiUrl(revid));
  const revision = data.query.pages[0]?.revisions[0];
  if (!revision) throw new Error(`Wikisource returned no revision ${revid}`);
  if (revision.revid !== revid) throw new Error(`expected Wikisource revid ${revid}, got ${revision.revid}`);
  return revision.slots.main.content;
}

/** Parse one kāṇḍa and attach provenance; no fetch, no write, so a test can run it on a fixture. */
export function buildTaittiriyaDocument(wikitext: string, kanda: number, retrievedAt: string): MantraDocument {
  const parsed = parseTaittiriya(wikitext, kanda);
  return withProvenance({ ...parsed, metadata: { ...parsed.metadata, license: LICENSE } }, {
    upstreamUrl: pageUrl(REVID),
    upstreamRef: `revid ${REVID}`,
    retrievedAt,
    parser: PARSER,
    license: LICENSE,
    attribution: `Taittirīya Saṃhitā, kāṇḍa ${kanda} — Wikisource (CC BY-SA 4.0)`,
  });
}

/** Fetch the pinned kāṇḍa 4 revision, parse it, attach provenance and write its file. */
async function generate(): Promise<ManifestEntry[]> {
  const retrievedAt = new Date().toISOString().slice(0, 10);
  const wikitext = await fetchRevision(REVID);
  const doc = buildTaittiriyaDocument(wikitext, KANDA, retrievedAt);
  const file = taittiriyaFile(KANDA);
  writeFileSync(join(SOURCES_DIR, file), `${JSON.stringify(doc, null, 2)}\n`);
  const provenance = doc.metadata.provenance!;
  console.log(`[${ID}] wrote ${file}`);
  return [{ id: doc.id, file, sha256: provenance.sha256, provenance }];
}

export default { id: ID, generate };

if (import.meta.main) {
  const entries = await generate();
  console.log(`[${ID}] ${entries.length} document(s) written`);
}
