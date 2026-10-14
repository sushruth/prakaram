import { describe, expect, it } from 'bun:test';
import { DEFAULT_PRAKARAS } from '../data';
import { MantraDocument } from '../types/mantra';
import { pratika, articlesForName, articlesInCategory, getArticle, listArticles, listCategories, searchArticles } from './wiki';

const doc = (id: string, over: Partial<MantraDocument['metadata']> & { sections?: number } = {}): MantraDocument => {
  const { sections = 1, ...meta } = over;
  return {
    id,
    title: { sanskrit: 'सूक्तम्', transliteration: 'Sūktam', english: `Hymn ${id}` },
    metadata: { source: 'Test source', ...meta },
    sections: Array.from({ length: sections }, (_, i) => ({
      id: `${id}-${i + 1}`,
      title: `Anuvaka ${i + 1}`,
      sectionNumber: i + 1,
      chunks: [{ id: `${id}-${i + 1}-a`, chunkNumber: 1, sanskrit: 'अ' }],
    })),
  };
};

const docs = [
  doc('rudram', { sections: 3, categories: ['Rudram', 'Shiva'], deity: 'Rudra', summary: 'A litany of names of Rudra.', status: 'proofread', license: 'Permission pending', related: ['sri', 'missing'] }),
  doc('sri', { categories: ['Devi', 'Suktas'], deity: 'Lakshmi', summary: 'Hymn to prosperity.' }),
  doc('shanti', { categories: ['Shanti mantras'], deity: 'Parabrahman', summary: 'Peace, with a line about Rudra.' }),
];

describe('wiki articles', () => {
  it('lists one article per document, in order', () => {
    expect(listArticles(docs).map((a) => a.id)).toEqual(['rudram', 'sri', 'shanti']);
  });

  it('carries the metadata and derives status, source and licence from the piece rules', () => {
    const a = getArticle('rudram', docs)!;
    expect(a.deity).toBe('Rudra');
    expect(a.summary).toBe('A litany of names of Rudra.');
    expect(a.status).toBe('proofread');
    expect(a.license).toBe('Permission pending');
    expect(a.source).toBe('Test source');
    expect(a.lines).toBe(3);
    const sri = getArticle('sri', docs)!;
    expect(sri.status).toBe('draft');
    expect(sri.license).toBeUndefined();
  });

  it('gives section pieceIds, and the document id for a single section', () => {
    expect(getArticle('rudram', docs)!.sections.map((s) => s.pieceId)).toEqual(['rudram/1', 'rudram/2', 'rudram/3']);
    expect(getArticle('sri', docs)!.sections.map((s) => s.pieceId)).toEqual(['sri']);
    expect(getArticle('rudram', docs)!.sections[1]).toMatchObject({ number: 2, title: 'Anuvaka 2', lines: 1 });
  });

  it('keeps related ids that exist and resolves them to English titles', () => {
    expect(getArticle('rudram', docs)!.related).toEqual([expect.objectContaining({ id: 'sri', title: 'Hymn sri' })]);
  });

  it('returns undefined for an unknown id', () => {
    expect(getArticle('nope', docs)).toBeUndefined();
  });

  it('links a live source to its upstream page, and falls back to the data file otherwise', () => {
    const base = doc('rigveda-1');
    const live = { ...base, metadata: { ...base.metadata, remoteUrl: 'https://example.org/rigveda-1' } };
    const a = getArticle('rigveda-1', [live])!;
    expect(a.sourceUrl).toBe('https://example.org/rigveda-1');
    expect(a.editUrl).toBe('https://example.org/rigveda-1');
    expect(a.historyUrl).toBe('https://example.org/rigveda-1');
    const local = getArticle('my-source', [doc('my-source')])!;
    expect(local.sourceUrl).toBe('https://github.com/sushruth/prakaram/blob/main/src/data/my-source.json');
    expect(local.editUrl).toBe('https://github.com/sushruth/prakaram/edit/main/src/data/my-source.json');
    expect(local.historyUrl).toBe('https://github.com/sushruth/prakaram/commits/main/src/data/my-source.json');
  });

  it('defaults to the default prakaras: compositions only, with no bundled sources', () => {
    const all = listArticles();
    expect(all.map((a) => a.id)).toEqual(DEFAULT_PRAKARAS.map((p) => p.id));
    expect(all.every((a) => a.kind === 'composition')).toBe(true);
    // A prakara whose live parts are not loaded yet resolves to no sections.
    expect(getArticle('maha-prakaram')?.parts).toEqual([]);
  });
});

describe('wiki categories', () => {
  it('counts documents per category, sorted by name', () => {
    const counts = listCategories(docs);
    expect(counts).toEqual([
      { name: 'Devi', count: 1 },
      { name: 'Rudram', count: 1 },
      { name: 'Shanti mantras', count: 1 },
      { name: 'Shiva', count: 1 },
      { name: 'Suktas', count: 1 },
    ]);
  });

  it('lists the articles in a category, ignoring case', () => {
    expect(articlesInCategory('shiva', docs).map((a) => a.id)).toEqual(['rudram']);
    expect(articlesInCategory('Nothing', docs)).toEqual([]);
  });
});

describe('wiki search', () => {
  it('returns everything for an empty query', () => {
    expect(searchArticles('  ', docs)).toHaveLength(3);
  });

  it('matches titles in the three scripts, ignoring case and diacritics', () => {
    const d = [doc('x', { categories: [] }), { ...doc('y'), title: { sanskrit: 'श्री सूक्तम्', transliteration: 'Śrī Sūktam', english: 'Hymn to Lakshmi' } }];
    expect(searchArticles('SRI', d).map((a) => a.id)).toEqual(['y']);
    expect(searchArticles('śrī', d).map((a) => a.id)).toEqual(['y']);
    expect(searchArticles('लक्ष्मी', d)).toEqual([]);
    expect(searchArticles('श्री', d).map((a) => a.id)).toEqual(['y']);
  });

  it('ranks title matches above category, deity and summary matches', () => {
    const d = [
      doc('summary-hit', { summary: 'mentions Shiva here' }),
      doc('category-hit', { categories: ['Shiva'] }),
      { ...doc('title-hit'), title: { sanskrit: 'शिव', transliteration: 'Shiva', english: 'Shiva hymn' } },
    ];
    expect(searchArticles('shiva', d).map((a) => a.id)).toEqual(['title-hit', 'category-hit', 'summary-hit']);
  });

  it('matches the deity', () => {
    expect(searchArticles('lakshmi', docs).map((a) => a.id)).toEqual(['sri']);
  });

  it('returns nothing when nothing matches', () => {
    expect(searchArticles('zzz', docs)).toEqual([]);
  });
});

describe('search over live-shaped fixtures', () => {
  const rv = doc('rigveda-2', { veda: 'rigveda', sections: 2, categories: ['Suktas'] });
  rv.sections[0].title = 'Prathama Anuvakah';
  const yv = doc('taittiriya-aranyaka-3', { veda: 'yajurveda', categories: ['Suktas'] });
  const corpus = [rv, yv];
  it('searches section titles and source', () => {
    expect(searchArticles('Prathama Anuvakah', corpus).map((a) => a.id)).toEqual(['rigveda-2']);
    expect(searchArticles('Test source', corpus).length).toBe(2);
  });
  it('counts an article under its Veda, and matches a category name', () => {
    expect(articlesForName('Rigveda', corpus).map((a) => a.id)).toEqual(['rigveda-2']);
    expect(articlesForName('Yajurveda', corpus).map((a) => a.id)).toEqual(['taittiriya-aranyaka-3']);
    expect(articlesForName('Suktas', corpus).length).toBe(2);
  });
});

describe('media and composed articles', () => {
  const work: MantraDocument = {
    ...doc('work'),
    sections: [],
    metadata: { source: 'Test', kind: 'composition', parts: [{ article: 'rudram', section: 2 }, { article: 'sri' }, { article: 'work' }, { article: 'gone' }] },
  };
  const all = [...docs, work];

  it('derives text media with swara detection and merges declared media', () => {
    const plain = getArticle('sri', docs)!;
    expect(plain.media[0]).toMatchObject({ kind: 'text', swara: false, count: 1 });
    const d = doc('sw', { media: [{ kind: 'audio', language: 'Sanskrit' }] });
    d.sections[0].chunks[0].sanskrit = 'अ॒ग्निम्';
    d.sections[0].chunks[0].translation = 'Fire';
    // A bundled translation is not advertised: translation is a gated experiment (src/config/features.ts).
    const m = getArticle('sw', [d])!.media;
    expect(m.map((x) => x.kind)).toEqual(['text', 'transliteration', 'audio']);
    expect(m[0].swara).toBe(true);
  });

  it('builds a composed article from parts, skipping cycles and missing references', () => {
    const a = getArticle('work', all)!;
    expect(a.kind).toBe('composition');
    expect(a.parts).toEqual(a.sections);
    expect(getArticle('rudram', all)!.usedIn).toEqual([expect.objectContaining({ id: 'work', title: 'Hymn work' })]);
    expect(getArticle('shanti', all)!.usedIn).toEqual([]);
    expect(getArticle('shanti', all)!.kind).toBe('source');
    expect(a.sections.map((s) => [s.number, s.pieceId])).toEqual([[1, 'rudram/2'], [2, 'sri']]);
    expect(a.sections[0].from).toMatchObject({ id: 'rudram', title: 'Hymn rudram', number: 2 });
    expect(a.lines).toBe(2);
  });

  it('cites every distinct source of a composition, in first-use order', () => {
    expect(getArticle('work', all)!.sources.map((s) => s.id)).toEqual(['rudram', 'sri']);
    expect(getArticle('work', all)!.sources[0].doc.id).toBe('rudram');
    // A source article cites just itself.
    expect(getArticle('rudram', all)!.sources.map((s) => s.id)).toEqual(['rudram']);
  });

  it('finds articles by media kind words', () => {
    expect(searchArticles('audio', [doc('x', { media: [{ kind: 'audio' }] }), doc('y')]).map((a) => a.id)).toEqual(['x']);
  });
});

describe('pratika', () => {
  it('takes about four words and an ellipsis', () => {
    expect(pratika(['नमस्ते रुद्र मन्यव उतोत इषवे नमः'])).toBe('नमस्ते रुद्र मन्यव उतोत…');
    expect(pratika(['नमस्ते रुद्र'])).toBe('नमस्ते रुद्र');
  });
  it('caps aksharas', () => {
    expect(pratika(['अअअअअअअअअअअअअअ अअअअअअअअअअअअअअ अअअ']).endsWith('…')).toBe(true);
  });
  it('skips a line that is only ॐ', () => {
    expect(pratika(['ॐ', 'नमस्ते रुद्र'])).toBe('नमस्ते रुद्र');
  });
  it('is empty for an empty section', () => {
    expect(pratika([])).toBe('');
    expect(pratika(['  ', 'ॐ'])).toBe('');
  });
});
