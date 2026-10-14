import { beforeEach, describe, expect, it } from 'bun:test';
import { ALL_SUKTAMS, SUKTA_MAP, registerDocument } from '../data';
import { VENDORED_SOURCES } from '../data/vendoredSources';
import type { MantraDocument } from '../types/mantra';
import { rebuildCorpus } from './wiki';
import { pendingSourceParts } from './liveLoading';

// Bun shares module state across test files, so a vendored document another file registered must be removed.
const VENDORED_IDS = new Set(VENDORED_SOURCES.map((s) => s.id));
const resetVendored = () => {
  for (let i = ALL_SUKTAMS.length - 1; i >= 0; i--) if (VENDORED_IDS.has(ALL_SUKTAMS[i].id)) ALL_SUKTAMS.splice(i, 1);
  for (const id of [...SUKTA_MAP.keys()]) if (VENDORED_IDS.has(id)) SUKTA_MAP.delete(id);
  rebuildCorpus();
};

const mkDoc = (id: string, sectionNumbers: number[]): MantraDocument => ({
  id,
  title: { sanskrit: 'सूक्तम्', transliteration: id, english: id },
  metadata: { kind: 'source', source: 'test', categories: [] },
  sections: sectionNumbers.map((n) => ({
    id: `${id}-${n}`,
    title: `Section ${n}`,
    sectionNumber: n,
    chunks: [{ id: `${id}-${n}-1`, chunkNumber: 1, sanskrit: 'अ॒ग्निमी॑ळे।' }],
  })),
});

describe('pendingSourceParts', () => {
  beforeEach(resetVendored);

  it('keeps a live source that is not registered yet', () => {
    expect(pendingSourceParts([{ id: 'rigveda-1', sections: [1] }], new Set())).toEqual([{ id: 'rigveda-1', sections: [1] }]);
  });

  it('drops a source no adapter owns', () => {
    expect(pendingSourceParts([{ id: 'not-a-source' }], new Set())).toEqual([]);
  });

  it('drops a source that already failed this session', () => {
    expect(pendingSourceParts([{ id: 'rigveda-1' }], new Set(['rigveda-1']))).toEqual([]);
  });

  it('drops a vendored source once the sections asked are registered', () => {
    registerDocument(mkDoc('rigveda-1', [1]));
    expect(pendingSourceParts([{ id: 'rigveda-1', sections: [1] }], new Set())).toEqual([]);
    // A section the document does not hold yet is still pending.
    expect(pendingSourceParts([{ id: 'rigveda-1', sections: [2] }], new Set())).toEqual([{ id: 'rigveda-1', sections: [2] }]);
  });

  it('keeps only the parts still to fetch', () => {
    const parts = [{ id: 'rigveda-1', sections: [1] }, { id: 'not-a-source' }, { id: 'rigveda-2' }];
    expect(pendingSourceParts(parts, new Set(['rigveda-2']))).toEqual([{ id: 'rigveda-1', sections: [1] }]);
  });
});
