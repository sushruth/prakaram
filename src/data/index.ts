import { MantraDocument } from '../types/mantra';
export { DEFAULT_PRAKARAS } from './defaultPrakaras';
import shantiMantras from './shantiMantras.json';
import ganapatiPrarthana from './ganapatiPrarthana.json';
import purushaSuktam from './purushaSuktam.json';
import sriSuktam from './sriSuktam.json';
import durgaSuktam from './durgaSuktam.json';
import narayanaSuktam from './narayanaSuktam.json';
import rudramNamakam from './rudramNamakam.json';
import rudramChamakam from './rudramChamakam.json';

export const ALL_SUKTAMS: MantraDocument[] = [
  shantiMantras as MantraDocument,
  ganapatiPrarthana as MantraDocument,
  purushaSuktam as MantraDocument,
  sriSuktam as MantraDocument,
  durgaSuktam as MantraDocument,
  narayanaSuktam as MantraDocument,
  rudramNamakam as MantraDocument,
  rudramChamakam as MantraDocument,
];

/** Adds a document loaded at runtime (a live-referenced source). Idempotent. */
export function registerDocument(doc: MantraDocument): void {
  if (ALL_SUKTAMS.some((d) => d.id === doc.id)) return;
  ALL_SUKTAMS.push(doc);
  SUKTA_MAP.set(doc.id, doc);
}

/**
 * Register a live document, or merge its sections into the one already registered so a partial load later
 * completes without duplicating or losing sections. Returns the document held in `SUKTA_MAP`.
 */
export function mergeDocument(doc: MantraDocument): MantraDocument {
  const existing = SUKTA_MAP.get(doc.id);
  if (!existing) {
    registerDocument(doc);
    return doc;
  }
  const byNumber = new Map(existing.sections.map((section) => [section.sectionNumber, section]));
  for (const section of doc.sections) byNumber.set(section.sectionNumber, section);
  existing.sections = [...byNumber.values()].sort((a, b) => a.sectionNumber - b.sectionNumber);
  existing.title = doc.title;
  existing.metadata = { ...existing.metadata, ...doc.metadata };
  return existing;
}

export const SUKTA_MAP = new Map<string, MantraDocument>(
  ALL_SUKTAMS.map((s) => [s.id, s])
);

/** The JSON file each document lives in, relative to src/data. Used for the wiki's source and edit links. */
export const SUKTA_FILE: Record<string, string> = {
  'shanti-mantras': 'shantiMantras.json',
  'ganapati-prarthana': 'ganapatiPrarthana.json',
  'purusha-suktam': 'purushaSuktam.json',
  'sri-suktam': 'sriSuktam.json',
  'durga-suktam': 'durgaSuktam.json',
  'narayana-suktam': 'narayanaSuktam.json',
  'rudram-namakam': 'rudramNamakam.json',
  'rudram-chamakam': 'rudramChamakam.json',
};
