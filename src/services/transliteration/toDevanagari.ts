import { iastToDevanagari } from './iastCodec';

/**
 * The renderer and its helpers (swara, mātrās, padya numerals, cite) read Devanagari. Text arrives either
 * in Devanagari or, per AGENTS.md §3.0, in IAST; these turn the IAST into Devanagari at the two entry
 * points (loading a vendored source, and the Sanskrit components) and leave Devanagari as it is.
 */
const INDIC = /[ऀ-ॿ꣠-ꣿ᳐-᳿]/;

/** Combining marks that only IAST letters carry: macron, dots, acute (ś), tilde (ñ), ring (l̥), swaras, gum. */
const IAST_MARKS = /[̠̣̥̱́̃̄̇̍̎̐ͫ]/;

/** A run of words: letters, combining marks, the avagraha apostrophe and spaces. */
const WORDS = /[\p{L}\p{M}' ]+/gu;

/** A Sanskrit-only field (a vendored `sanskrit` string): IAST unless it already holds Indic script. */
export const sanskritFieldToDevanagari = (s: string): string => (INDIC.test(s) ? s : iastToDevanagari(s));

/**
 * Text written in code, which may mix English and IAST ('Ganesha Suktam · ā tū na indra'). Each run of
 * words between punctuation becomes Devanagari only when it carries an IAST diacritic, so plain English
 * runs stay English. A string that already holds Indic script is returned unchanged.
 */
export function displayToDevanagari(s: string): string {
  if (!s || INDIC.test(s)) return s;
  return s.replace(WORDS, (run) => (IAST_MARKS.test(run.normalize('NFD')) ? iastToDevanagari(run) : run));
}

/** A copy of a loaded source index or part with every `sanskrit` string in Devanagari. */
export function sourceToDevanagari<T>(value: T): T {
  if (Array.isArray(value)) return value.map(sourceToDevanagari) as T;
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, k === 'sanskrit' && typeof v === 'string' ? sanskritFieldToDevanagari(v) : sourceToDevanagari(v)]),
  ) as T;
}
