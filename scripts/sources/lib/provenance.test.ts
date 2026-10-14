import { describe, expect, it } from 'bun:test';
import type { MantraDocument, SourceProvenance } from '../../../src/types/mantra';
import { canonicalJson, verifyProvenance, withProvenance } from './provenance';

const doc = (): MantraDocument => ({
  id: 'test-1',
  title: { sanskrit: 'क', transliteration: 'ka', english: 'Ka' },
  metadata: { source: 'test', status: 'draft' },
  sections: [{ id: 'test-1-1', title: 'S', sectionNumber: 1, chunks: [{ id: 'c1', chunkNumber: 1, sanskrit: 'अ॒ग्निमी॑ळे।' }] }],
});

const prov: Omit<SourceProvenance, 'sha256'> = {
  upstreamUrl: 'https://example.test/x',
  upstreamRef: '2026-10-13',
  retrievedAt: '2026-10-13',
  parser: 'test@1',
  license: 'CC0',
  attribution: 'Test',
};

describe('canonicalJson', () => {
  it('sorts keys at every depth, so key order never changes the string', () => {
    const a = { b: 1, a: { d: 2, c: [3, { f: 4, e: 5 }] } };
    const b = { a: { c: [3, { e: 5, f: 4 }], d: 2 }, b: 1 };
    expect(canonicalJson(a)).toBe(canonicalJson(b));
    expect(canonicalJson(a)).toBe('{"a":{"c":[3,{"e":5,"f":4}],"d":2},"b":1}');
  });

  it('keeps array order', () => {
    expect(canonicalJson([3, 1, 2])).toBe('[3,1,2]');
  });
});

describe('withProvenance / verifyProvenance', () => {
  it('attaches a sha256 and verifies the untouched document', () => {
    const signed = withProvenance(doc(), prov);
    expect(signed.metadata.provenance?.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(verifyProvenance(signed)).toBe(true);
  });

  it('is reproducible: the same document and provenance hash the same', () => {
    const first = withProvenance(doc(), prov).metadata.provenance?.sha256;
    const second = withProvenance(doc(), prov).metadata.provenance?.sha256;
    expect(first).toBe(second);
  });

  it('detects a tampered text field', () => {
    const signed = withProvenance(doc(), prov);
    signed.sections[0].chunks[0].sanskrit = 'तत्स॑वि॒तु॒र्वरे᳚ण्यम्।';
    expect(verifyProvenance(signed)).toBe(false);
  });

  it('detects a tampered provenance field', () => {
    const signed = withProvenance(doc(), prov);
    const provenance = signed.metadata.provenance;
    if (!provenance) throw new Error('provenance missing');
    provenance.upstreamRef = 'tampered';
    expect(verifyProvenance(signed)).toBe(false);
  });

  it('detects a tampered sha256 and rejects a document with no provenance', () => {
    const signed = withProvenance(doc(), prov);
    const provenance = signed.metadata.provenance;
    if (!provenance) throw new Error('provenance missing');
    provenance.sha256 = '0'.repeat(64);
    expect(verifyProvenance(signed)).toBe(false);
    expect(verifyProvenance(doc())).toBe(false);
  });
});
