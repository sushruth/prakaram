import { describe, it, expect } from 'bun:test';
import { encodePrakaraToUrlHash, decodePrakaraFromUrlHash } from './urlCodec';
import { Prakara } from '../types/mantra';

describe('Prakara URL Codec', () => {
  const testPrakara: Prakara = {
    id: 'test-prakara',
    title: 'Purusha Suktam Test',
    description: 'Unit test sequence',
    preferredBpm: 84,
    createdTimestamp: 1700000000,
    items: [
      { id: 'item-1', type: 'sukta_ref', suktaId: 'purusha-suktam' },
      { id: 'item-2', type: 'vakya', customTitle: 'Dhyanam', customText: 'शान्ताकारं भुजगशयनम्' }
    ]
  };

  it('compresses Prakara into URL safe string and decompresses accurately', async () => {
    const hash = await encodePrakaraToUrlHash(testPrakara);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(10);
    expect(hash).toMatch(/^[A-Za-z0-9_-]+$/);

    const decoded = await decodePrakaraFromUrlHash(hash);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe(testPrakara.id);
    expect(decoded?.title).toBe(testPrakara.title);
    expect(decoded?.preferredBpm).toBe(84);
    expect(decoded?.items.length).toBe(2);
    expect(decoded?.items[1].customText).toBe('शान्ताकारं भुजगशयनम्');
  });
});
