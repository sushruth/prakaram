import { MantraDocument, MediaDecl, Prakara, SuktaSection } from '../types/mantra';
import { ALL_SUKTAMS, DEFAULT_PRAKARAS, SUKTA_FILE } from '../data';
import { itemNirdesa, listPieces } from './koshah';
import { parseNirdesa } from './nirdesa';
import { splitTitle } from './titles';
import { transliterateVedic } from './transliteration';

export interface WikiMedia extends MediaDecl {
  /** Lines, for derived text and translation. */
  count?: number;
}

export interface WikiSection {
  id: string;
  number: number;
  title: string;
  lines: number;
  /** `${docId}/${n}` for a section of a multi-section document, or the document id when it has one section. */
  pieceId: string;
  /** Set when the section comes from another article (a composed work). */
  from?: { id: string; title: string; sanskrit: string; number: number };
}

/** A link to another article: its Sanskrit and English titles; the view picks the script. */
export interface ArticleRef {
  id: string;
  title: string;
  sanskrit: string;
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
  related: ArticleRef[];
  sections: WikiSection[];
  media: WikiMedia[];
  kind: 'source' | 'composition';
  /** Resolved parts of a composition, in order (the same entries as `sections`); empty for a source. */
  parts: WikiSection[];
  /** Compositions that reference any part of this source. */
  usedIn: ArticleRef[];
  lines: number;
  sourceUrl: string;
  editUrl: string;
  historyUrl: string;
}

const REPO_URL = 'https://github.com/sushruth/prakaram';
const BRANCH = 'main';

interface Part {
  doc: MantraDocument;
  section: SuktaSection;
  /** Piece id of the section in its own document. */
  pieceId: string;
}

/** The sections an article shows: its own, or the parts it is composed of. Missing references and cycles are skipped. */
function resolveParts(doc: MantraDocument, docs: MantraDocument[], seen: string[] = []): Part[] {
  if (doc.metadata.kind !== 'composition') {
    const multi = doc.sections.length > 1;
    return doc.sections.map((section) => ({ doc, section, pieceId: multi ? `${doc.id}/${section.sectionNumber}` : doc.id }));
  }
  const path = [...seen, doc.id];
  return (doc.metadata.parts ?? []).flatMap((ref) => {
    const src = docs.find((d) => d.id === ref.article);
    if (!src || path.includes(src.id)) return [];
    return resolveParts(src, docs, path).filter((p) => ref.section === undefined || p.section.sectionNumber === ref.section);
  });
}

const SWARA = /[\u0951\u0952\u1CDA]/;
const SCRIPTS = 'IAST, Telugu, Kannada, Malayalam, Tamil';

function deriveMedia(parts: Part[], declared: MediaDecl[]): WikiMedia[] {
  const chunks = parts.flatMap((p) => p.section.chunks);
  const media: WikiMedia[] = [
    { kind: 'text', language: 'Sanskrit', script: 'Devanagari', swara: chunks.some((c) => SWARA.test(c.sanskrit)), count: chunks.length },
    { kind: 'transliteration', script: SCRIPTS, swara: true },
  ];
  const translated = chunks.filter((c) => c.translation).length;
  if (translated) media.push({ kind: 'translation', language: 'English', count: translated });
  return [...media, ...declared];
}

/** A default prakara as a composition article: its sukta items become parts. Procedural vakyas have text of their own and are left out. */
export function prakaraAsDoc(p: Prakara, docs: MantraDocument[]): MantraDocument {
  const title = splitTitle(p.title);
  const parts = p.items.flatMap((i) => {
    if (i.type !== 'sukta_ref' || !i.suktaId) return [];
    // ponytail: a composition part is a whole section; a line range widens to its section here.
    const section = parseNirdesa(itemNirdesa(i, docs) ?? '')?.section;
    return [{ article: i.suktaId, ...(section ? { section } : {}) }];
  });
  return {
    id: p.id,
    title: { ...title, transliteration: transliterateVedic(title.sanskrit, 'iast') },
    metadata: { source: p.author ?? 'Composition', kind: 'composition', parts, summary: p.description, categories: ['Compositions'] },
    sections: [],
  };
}

const CORPUS = [...ALL_SUKTAMS, ...DEFAULT_PRAKARAS.map((p) => prakaraAsDoc(p, ALL_SUKTAMS))];

const toArticle = (doc: MantraDocument, docs: MantraDocument[]): WikiArticle => {
  const pieces = listPieces([doc]);
  const whole = pieces[0];
  // ponytail: a missing file map entry falls back to `<id>.json`; only happens for docs outside ALL_SUKTAMS.
  const file = SUKTA_FILE[doc.id] ?? (doc.metadata.kind === 'composition' ? 'defaultPrakaras.ts' : `${doc.id}.json`);
  const path = `src/data/${file}`;
  const parts = resolveParts(doc, docs);
  const composed = doc.metadata.kind === 'composition';
  const sections: WikiSection[] = parts.map((p, i) => ({
    id: p.section.id,
    number: composed ? i + 1 : p.section.sectionNumber,
    title: p.section.title,
    lines: p.section.chunks.length,
    pieceId: p.pieceId,
    ...(composed ? { from: { id: p.doc.id, title: p.doc.title.english, sanskrit: p.doc.title.sanskrit, number: p.section.sectionNumber } } : {}),
  }));
  // A composition is only as reviewed as its least reviewed part.
  const rank = ['draft', 'proofread', 'reviewed'] as const;
  const status = composed ? rank[Math.min(2, ...parts.map((p) => rank.indexOf(p.doc.metadata.status ?? 'draft')))] : whole.status;
  return {
    id: doc.id,
    title: doc.title,
    summary: doc.metadata.summary ?? '',
    veda: doc.metadata.veda,
    deity: doc.metadata.deity,
    usage: doc.metadata.usage,
    source: whole.source,
    status,
    license: whole.license,
    categories: doc.metadata.categories ?? [],
    related: (doc.metadata.related ?? []).flatMap((id) => {
      const other = docs.find((d) => d.id === id);
      return other ? [{ id, title: other.title.english, sanskrit: other.title.sanskrit }] : [];
    }),
    sections,
    media: deriveMedia(parts, doc.metadata.media ?? []),
    kind: composed ? 'composition' : 'source',
    parts: composed ? sections : [],
    usedIn: composed
      ? []
      : docs
          .filter((c) => c.metadata.kind === 'composition' && resolveParts(c, docs).some((p) => p.doc.id === doc.id))
          .map((c) => ({ id: c.id, title: c.title.english, sanskrit: c.title.sanskrit })),
    lines: composed ? parts.reduce((n, p) => n + p.section.chunks.length, 0) : whole.lines,
    sourceUrl: `${REPO_URL}/blob/${BRANCH}/${path}`,
    editUrl: `${REPO_URL}/edit/${BRANCH}/${path}`,
    historyUrl: `${REPO_URL}/commits/${BRANCH}/${path}`,
  };
};

export function listArticles(docs: MantraDocument[] = CORPUS): WikiArticle[] {
  return docs.map((d) => toArticle(d, docs));
}

export function getArticle(id: string, docs: MantraDocument[] = CORPUS): WikiArticle | undefined {
  const doc = docs.find((d) => d.id === id);
  return doc ? toArticle(doc, docs) : undefined;
}

export function listCategories(docs: MantraDocument[] = CORPUS): { name: string; count: number }[] {
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

export function articlesInCategory(name: string, docs: MantraDocument[] = CORPUS): WikiArticle[] {
  const want = name.trim().toLowerCase();
  return listArticles(docs).filter((a) => a.categories.some((c) => c.toLowerCase() === want));
}

/** Pages in a category, or carrying the name as their Veda or deity. Used by the category page and the home counts. */
export function articlesForName(name: string, docs: MantraDocument[] = CORPUS): WikiArticle[] {
  const want = name.trim().toLowerCase();
  return listArticles(docs).filter(
    (a) => a.categories.some((c) => c.toLowerCase() === want) || `${a.kind}s` === want || a.veda?.toLowerCase() === want || a.deity?.toLowerCase() === want,
  );
}

/** Lower case, with Latin diacritics removed, so "Sri" finds "Śrī". Devanagari matras are left alone. */
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Ranked: a title match scores 3, a category or deity match 2, a summary match 1, a section title or source match 0.5. Ties keep document order. */
export function searchArticles(query: string, docs: MantraDocument[] = CORPUS): WikiArticle[] {
  const q = fold(query.trim());
  if (!q) return listArticles(docs);
  const hit = (s: string | undefined) => s !== undefined && fold(s).includes(q);
  return listArticles(docs)
    .map((a) => {
      const title = [a.title.sanskrit, a.title.transliteration, a.title.english].some(hit);
      const meta = hit(a.deity) || a.categories.some(hit) || a.media.some((m) => hit(m.kind) || hit(m.label));
      const score = title ? 3 : meta ? 2 : hit(a.summary) ? 1 : a.sections.some((s) => hit(s.title)) || hit(a.source) ? 0.5 : 0;
      return { a, score };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .map((x) => x.a);
}
