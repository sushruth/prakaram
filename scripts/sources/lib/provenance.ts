import type { SourceProvenance } from '../../../src/types/mantra';
import { sha256Hex } from './hash';

/**
 * Provenance helpers (see sources/README.md). A generated document carries `metadata.provenance`
 * whose `sha256` is the hash of the document JSON with `sha256` blanked, so it is reproducible and
 * any later edit to the text (or to the rest of the provenance) changes the hash. A vendored source
 * keeps provenance on its index document only.
 */

/** Anything that carries `metadata.provenance`: a `MantraDocument` or a `SourceIndex`. */
export interface Provenanced {
  metadata: { provenance?: SourceProvenance };
}

/** A JSON value: what `JSON.parse` produces, so the sort can be typed without `unknown`. */
type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/** Recursively sort object keys, so the same document always serialises to the same bytes. */
function sort(value: Json): Json {
  if (Array.isArray(value)) return value.map(sort);
  if (value !== null && typeof value === 'object') {
    const out: { [key: string]: Json } = {};
    for (const key of Object.keys(value).sort()) out[key] = sort(value[key]);
    return out;
  }
  return value;
}

/** A stable JSON string: object keys sorted at every depth, arrays in order. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sort(value as Json));
}

/** The document with its provenance `sha256` blanked, the exact input to the hash. */
function blanked<T extends Provenanced>(doc: T, prov: SourceProvenance): T {
  return { ...doc, metadata: { ...doc.metadata, provenance: { ...prov, sha256: '' } } };
}

/** Attach provenance to a document, computing `sha256` from the document with `sha256` blanked. */
export function withProvenance<T extends Provenanced>(doc: T, prov: Omit<SourceProvenance, 'sha256'>): T {
  const sha256 = sha256Hex(canonicalJson(blanked(doc, { ...prov, sha256: '' })));
  return { ...doc, metadata: { ...doc.metadata, provenance: { ...prov, sha256 } } };
}

/** True when the document's stored `sha256` matches a fresh hash of its content. */
export function verifyProvenance(doc: Provenanced): boolean {
  const prov = doc.metadata.provenance;
  if (!prov) return false;
  const recomputed = sha256Hex(canonicalJson(blanked(doc, prov)));
  return recomputed === prov.sha256;
}
