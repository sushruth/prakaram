import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import type { MantraDocument, SourceIndex, SourceProvenance, SuktaSection } from '../../../src/types/mantra';
import { sha256Hex } from './hash';
import type { ManifestEntry, ManifestMetrics, ManifestPart, WorkMetric } from './manifest';
import { withProvenance } from './provenance';

/**
 * Splitting a processed document into an index plus part files (see sources/README.md). Sections are grouped at
 * the source's natural division, then small adjacent divisions are packed together while the merged part stays
 * within `MAX_PART_GZIP`, so a reader downloads only the parts a work needs. The rule and its budgets are
 * exported so `sources:refresh` reports and enforces them, and a unit test can pin them.
 */

/** A part must never exceed this gzipped size. */
export const MAX_PART_GZIP = 20 * 1024;

/** A natural division at or above this gzipped size is substantial and stands alone; only smaller ones pack. */
export const MERGE_FLOOR_GZIP = MAX_PART_GZIP / 4;

/** A named work and the budget its parts must meet; `divisions` are natural-division keys of `source`. */
export interface NamedWork {
  id: string;
  label: string;
  source: string;
  divisions: (string | number)[];
  maxGzip: number;
  maxParts: number;
}

/** The works whose size `sources:refresh` checks. The Rudram is prapāṭhaka 5 + 7 of the Taittirīya Saṃhitā. */
export const NAMED_WORKS: NamedWork[] = [
  { id: 'rudram', label: 'Śrī Rudram', source: 'taittiriya-samhita-4', divisions: [5, 7], maxGzip: 25 * 1024, maxParts: 3 },
];

/** The path of a document's index relative to `sources/`. */
export const indexPath = (docId: string): string => `${docId}/index.json`;

/** A built source, ready to write: the index shell and the part files it points at. */
export interface BuiltSource {
  index: SourceIndex;
  parts: { file: string; sections: SuktaSection[] }[];
}

/** The fields a part's sections must carry; a `SuktaSection` qualifies, and so does a test stub. */
export interface PartSection {
  id: string;
  sectionNumber: number;
  title: string;
  chunks: unknown[];
}

/** The exact bytes of a part file, used for its size and hash and for the merge decision. */
export const serializePart = (sections: PartSection[]): string => `${JSON.stringify({ sections }, null, 2)}\n`;

/** The gzipped byte size of a string. */
export const gzipBytes = (text: string): number => gzipSync(Buffer.from(text, 'utf8')).length;

/** The gzipped byte size of a would-be part. */
export const partGzip = (sections: PartSection[]): number => gzipBytes(serializePart(sections));

/** The prapāṭhaka of a Taittirīya Saṃhitā section id `taittiriya-samhita-<k>-<p>-<a>`, or undefined. */
export function prapathakaOf(sectionId: string): number | undefined {
  const m = /^taittiriya-samhita-(\d+)-(\d+)-(\d+)$/.exec(sectionId);
  return m ? Number(m[2]) : undefined;
}

/** A section's natural-division key in `docId`: the prapāṭhaka for the Saṃhitā, else the section itself. */
export function naturalDivisionKey(docId: string, section: { id: string; sectionNumber: number }): string | number {
  return (docId.startsWith('taittiriya-samhita-') ? prapathakaOf(section.id) : undefined) ?? section.sectionNumber;
}

/**
 * Group sections into contiguous parts: first at the natural division, then pack adjacent divisions while the
 * merged part stays ≤ `MAX_PART_GZIP`. A division at or above `MERGE_FLOOR_GZIP` stands alone, so a work's own
 * division is never bundled with an unrelated neighbour. Deterministic; the cap holds for every part.
 */
export function groupSections<T extends PartSection>(sections: T[], divisionKey: (section: T) => string | number): T[][] {
  const divisions: T[][] = [];
  for (const section of sections) {
    const last = divisions[divisions.length - 1];
    if (last && divisionKey(last[0]) === divisionKey(section)) last.push(section);
    else divisions.push([section]);
  }
  const parts: T[][] = [];
  let current: T[] = [];
  for (const division of divisions) {
    if (current.length === 0) {
      current = division;
      continue;
    }
    if (partGzip(division) < MERGE_FLOOR_GZIP && partGzip([...current, ...division]) <= MAX_PART_GZIP) current = [...current, ...division];
    else {
      parts.push(current);
      current = division;
    }
  }
  if (current.length) parts.push(current);
  return parts;
}

/** Build a document's index and parts: group its sections, then point each index section at its part file. */
export function buildSource(doc: MantraDocument, prov: Omit<SourceProvenance, 'sha256'>): BuiltSource {
  const parts = groupSections(doc.sections, (section) => naturalDivisionKey(doc.id, section)).map((sections, i) => ({ file: `part-${i + 1}.json`, sections }));
  const fileOf = new Map<SuktaSection, string>();
  for (const part of parts) for (const section of part.sections) fileOf.set(section, part.file);
  const index = withProvenance(
    {
      id: doc.id,
      title: doc.title,
      metadata: doc.metadata,
      sections: doc.sections.map((section) => ({
        id: section.id,
        sectionNumber: section.sectionNumber,
        title: section.title,
        file: fileOf.get(section)!,
        chunkCount: section.chunks.length,
      })),
    } satisfies SourceIndex,
    prov,
  );
  return { index, parts };
}

/** Write a built source's index and parts under `sources/<docId>/`, returning its manifest entry. */
export function writeSource(dir: string, built: BuiltSource): ManifestEntry {
  mkdirSync(join(dir, built.index.id), { recursive: true });
  writeFileSync(join(dir, built.index.id, 'index.json'), `${JSON.stringify(built.index, null, 2)}\n`);
  const parts: ManifestPart[] = built.parts.map((part) => {
    const text = serializePart(part.sections);
    writeFileSync(join(dir, built.index.id, part.file), text);
    return { file: `${built.index.id}/${part.file}`, sha256: sha256Hex(text), bytes: Buffer.byteLength(text), gzip: gzipBytes(text) };
  });
  const provenance = built.index.metadata.provenance!;
  return { id: built.index.id, index: indexPath(built.index.id), sha256: provenance.sha256, provenance, parts };
}

/** One named work's measured size, from the parts whose sections fall in its divisions. */
function workMetric(work: NamedWork, entries: ManifestEntry[], dir: string): WorkMetric {
  const entry = entries.find((e) => e.id === work.source);
  const covering = entry
    ? entry.parts.filter((part) => {
        const sections = (JSON.parse(readFileSync(join(dir, part.file), 'utf8')) as { sections: { id: string; sectionNumber: number }[] }).sections;
        return sections.some((section) => work.divisions.includes(naturalDivisionKey(entry.id, section)));
      })
    : [];
  const gzip = covering.reduce((n, part) => n + part.gzip, 0);
  return {
    id: work.id,
    label: work.label,
    parts: covering.length,
    gzip,
    budget: work.maxGzip,
    maxParts: work.maxParts,
    ok: covering.length > 0 && covering.length <= work.maxParts && gzip <= work.maxGzip,
  };
}

/** The budget failures in a run: a part over the cap or a work over its budget or part count. Empty means pass. */
export function budgetFailures(entries: ManifestEntry[], metrics: ManifestMetrics): string[] {
  const oversize = entries.flatMap((entry) =>
    entry.parts.filter((part) => part.gzip > MAX_PART_GZIP).map((part) => `part over cap: ${part.file} ${part.gzip} B > ${MAX_PART_GZIP} B`),
  );
  const works = metrics.works
    .filter((work) => !work.ok)
    .map((work) => `work over budget: ${work.id} ${work.parts} parts / ${work.gzip} B (budget ${work.budget} B, max ${work.maxParts} parts)`);
  return [...oversize, ...works];
}

/** The size report for a set of generated sources: totals, the largest part and every named work. */
export function buildManifestMetrics(entries: ManifestEntry[], dir: string): ManifestMetrics {
  let raw = 0;
  let gzip = 0;
  let largestPart: ManifestMetrics['largestPart'] = null;
  for (const entry of entries) {
    const indexText = readFileSync(join(dir, entry.index), 'utf8');
    raw += Buffer.byteLength(indexText);
    gzip += gzipBytes(indexText);
    for (const part of entry.parts) {
      raw += part.bytes;
      gzip += part.gzip;
      if (!largestPart || part.gzip > largestPart.gzip) largestPart = { file: part.file, gzip: part.gzip };
    }
  }
  return { total: { raw, gzip }, largestPart, works: NAMED_WORKS.map((work) => workMetric(work, entries, dir)) };
}
