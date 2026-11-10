/** Rewrite every vendored source in place with its `sanskrit` text in IAST (AGENTS.md §3.0), without refetching. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MantraDocument, SourceIndex, SuktaSection } from '../../src/types/mantra';
import { readManifest, writeManifest } from './lib/manifest';
import { buildManifestMetrics, buildSource, writeSource } from './lib/parts';

const SOURCES_DIR = join(import.meta.dir, '..', '..', 'sources');
const read = <T>(path: string): T => JSON.parse(readFileSync(join(SOURCES_DIR, path), 'utf8')) as T;

const entries = readManifest().sources.map((entry) => {
  const index = read<SourceIndex>(entry.index);
  const parts = new Map<string, SuktaSection[]>();
  for (const s of index.sections) if (!parts.has(s.file)) parts.set(s.file, read<{ sections: SuktaSection[] }>(`${index.id}/${s.file}`).sections);
  const sections = index.sections.map((s) => parts.get(s.file)!.find((p) => p.id === s.id)!);
  const { provenance, ...metadata } = index.metadata;
  const { sha256: _, ...prov } = provenance!;
  const doc: MantraDocument = { id: index.id, title: index.title, metadata, sections };
  return writeSource(SOURCES_DIR, buildSource(doc, prov));
});
const manifest = writeManifest(entries, buildManifestMetrics(entries, SOURCES_DIR));
console.log(`${manifest.sources.length} sources rewritten in IAST`);
