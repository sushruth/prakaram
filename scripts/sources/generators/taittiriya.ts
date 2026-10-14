/**
 * Generator contract: a module under `scripts/sources/generators/` default-exports
 * `{ id: string; generate(): Promise<ManifestEntry[]> }`. `generate()` fetches its upstream, parses,
 * builds the document's index + part files under `sources/<docId>/` and returns the manifest entries.
 * It never writes `manifest.json` — `scripts/sources/refresh.ts` owns that — so any two generators can
 * run at once without racing. A module is directly runnable
 * (`bun scripts/sources/generators/taittiriya.ts`) and writes only its own files.
 */
import { join } from 'node:path';
import type { MantraDocument, SourceProvenance } from '../../../src/types/mantra';
import { parseTaittiriya } from '../parsers/taittiriya';
import { getJson } from '../lib/fetch';
import { buildSource, writeSource } from '../lib/parts';
import type { ManifestEntry } from '../lib/manifest';

const ID = 'taittiriya-samhita';
const PARSER = 'taittiriya@1';
/** Only kāṇḍa 4 is in the vendored table; its Wikisource revision is pinned. */
const KANDA = 4;
const REVID = 417990;
const PAGE = 'तैत्तिरीयसंहिता-१-४';
/**
 * The CC BY-SA 4.0 licence string for the Wikisource-derived file, verbatim from
 * docs/licence-compliance.md §2.2. It names the source and its revision, states the modification and the
 * ShareAlike, and gives the licence URI, and is set on `metadata.license` too so it stays equal to
 * `provenance.license`.
 */
const LICENSE =
  'CC BY-SA 4.0 — Adapted from "तैत्तिरीयसंहिता-१-४", Sanskrit Wikisource, revid 417990 (Wikisource contributors), used and licensed under CC BY-SA 4.0. Licence text: https://creativecommons.org/licenses/by-sa/4.0/';
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

/** The wikitext of the pinned revision, failing loudly if the server serves a different revid. */
export async function fetchRevision(revid: number): Promise<string> {
  const data = await getJson<WikiResponse>(apiUrl(revid));
  const revision = data.query.pages[0]?.revisions[0];
  if (!revision) throw new Error(`Wikisource returned no revision ${revid}`);
  if (revision.revid !== revid) throw new Error(`expected Wikisource revid ${revid}, got ${revision.revid}`);
  return revision.slots.main.content;
}

/** Parse one kāṇḍa into a raw document (no provenance; the index carries it); no fetch, no write. */
export function buildTaittiriyaDocument(wikitext: string, kanda: number): MantraDocument {
  const parsed = parseTaittiriya(wikitext, kanda);
  return { ...parsed, metadata: { ...parsed.metadata, license: LICENSE } };
}

/** The provenance for kāṇḍa `kanda` of the pinned revision. */
export function taittiriyaProvenance(kanda: number, retrievedAt: string): Omit<SourceProvenance, 'sha256'> {
  return {
    upstreamUrl: pageUrl(REVID),
    upstreamRef: `revid ${REVID}`,
    retrievedAt,
    parser: PARSER,
    license: LICENSE,
    attribution: `Taittirīya Saṃhitā, kāṇḍa ${kanda} — Wikisource contributors, "तैत्तिरीयसंहिता-१-४" revid ${REVID}, CC BY-SA 4.0`,
  };
}

/** Fetch the pinned kāṇḍa 4 revision, parse it, build and write its index + parts. */
async function generate(): Promise<ManifestEntry[]> {
  const retrievedAt = new Date().toISOString().slice(0, 10);
  const wikitext = await fetchRevision(REVID);
  const doc = buildTaittiriyaDocument(wikitext, KANDA);
  const entry = writeSource(SOURCES_DIR, buildSource(doc, taittiriyaProvenance(KANDA, retrievedAt)));
  console.log(`[${ID}] wrote ${entry.index} + ${entry.parts.length} part(s)`);
  return [entry];
}

export default { id: ID, generate };

if (import.meta.main) {
  const entries = await generate();
  console.log(`[${ID}] ${entries.length} document(s) written`);
}
