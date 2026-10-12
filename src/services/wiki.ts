import { MantraDocument } from '../types/mantra';
import { ALL_SUKTAMS, SUKTA_FILE } from '../data';
import { listPieces } from './koshah';

export interface WikiSection {
  id: string;
  number: number;
  title: string;
  lines: number;
  /** `${docId}/${n}` for a section of a multi-section document, or the document id when it has one section. */
  pieceId: string;
}

export interface WikiArticle {
  id: string;
  title: { sanskrit: string; transliteration: string; english: string };
  summary: string;
  veda?: string;
  deity?: string;
  usage?: string;
  source: string;
  status: 'draft' | 'proofread' | 'reviewed';
  license?: string;
  categories: string[];
  related: { id: string; title: string }[];
  sections: WikiSection[];
  lines: number;
  sourceUrl: string;
  editUrl: string;
  historyUrl: string;
}

const REPO_URL = 'https://github.com/sushruth/prakaram';
const BRANCH = 'main';

const toArticle = (doc: MantraDocument, docs: MantraDocument[]): WikiArticle => {
  const pieces = listPieces([doc]);
  const whole = pieces[0];
  // ponytail: a missing file map entry falls back to `<id>.json`; only happens for docs outside ALL_SUKTAMS.
  const file = SUKTA_FILE[doc.id] ?? `${doc.id}.json`;
  const path = `src/data/${file}`;
  const multi = doc.sections.length > 1;
  return {
    id: doc.id,
    title: doc.title,
    summary: doc.metadata.summary ?? '',
    veda: doc.metadata.veda,
    deity: doc.metadata.deity,
    usage: doc.metadata.usage,
    source: whole.source,
    status: whole.status,
    license: whole.license,
    categories: doc.metadata.categories ?? [],
    related: (doc.metadata.related ?? []).flatMap((id) => {
      const other = docs.find((d) => d.id === id);
      return other ? [{ id, title: other.title.english }] : [];
    }),
    sections: doc.sections.map((s) => ({
      id: s.id,
      number: s.sectionNumber,
      title: s.title,
      lines: s.chunks.length,
      pieceId: multi ? `${doc.id}/${s.sectionNumber}` : doc.id,
    })),
    lines: whole.lines,
    sourceUrl: `${REPO_URL}/blob/${BRANCH}/${path}`,
    editUrl: `${REPO_URL}/edit/${BRANCH}/${path}`,
    historyUrl: `${REPO_URL}/commits/${BRANCH}/${path}`,
  };
};

export function listArticles(docs: MantraDocument[] = ALL_SUKTAMS): WikiArticle[] {
  return docs.map((d) => toArticle(d, docs));
}

export function getArticle(id: string, docs: MantraDocument[] = ALL_SUKTAMS): WikiArticle | undefined {
  const doc = docs.find((d) => d.id === id);
  return doc ? toArticle(doc, docs) : undefined;
}

export function listCategories(docs: MantraDocument[] = ALL_SUKTAMS): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const doc of docs) {
    for (const name of new Set(doc.metadata.categories ?? [])) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function articlesInCategory(name: string, docs: MantraDocument[] = ALL_SUKTAMS): WikiArticle[] {
  const want = name.trim().toLowerCase();
  return listArticles(docs).filter((a) => a.categories.some((c) => c.toLowerCase() === want));
}

/** Pages in a category, or carrying the name as their Veda or deity. Used by the category page and the home counts. */
export function articlesForName(name: string, docs: MantraDocument[] = ALL_SUKTAMS): WikiArticle[] {
  const want = name.trim().toLowerCase();
  return listArticles(docs).filter(
    (a) => a.categories.some((c) => c.toLowerCase() === want) || a.veda?.toLowerCase() === want || a.deity?.toLowerCase() === want,
  );
}

/** Lower case, with Latin diacritics removed, so "Sri" finds "Śrī". Devanagari matras are left alone. */
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Ranked: a title match scores 3, a category or deity match 2, a summary match 1, a section title or source match 0.5. Ties keep document order. */
export function searchArticles(query: string, docs: MantraDocument[] = ALL_SUKTAMS): WikiArticle[] {
  const q = fold(query.trim());
  if (!q) return listArticles(docs);
  const hit = (s: string | undefined) => s !== undefined && fold(s).includes(q);
  return listArticles(docs)
    .map((a) => {
      const title = [a.title.sanskrit, a.title.transliteration, a.title.english].some(hit);
      const meta = hit(a.deity) || a.categories.some(hit);
      const score = title ? 3 : meta ? 2 : hit(a.summary) ? 1 : a.sections.some((s) => hit(s.title)) || hit(a.source) ? 0.5 : 0;
      return { a, score };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .map((x) => x.a);
}
