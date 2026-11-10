import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { devanagariToIast } from '../../../src/services/transliteration/iastCodec';
import { parseSaswaraRigvedaMandala } from './saswaraRigveda';

const html = readFileSync(join(import.meta.dir, 'fixtures/saswara-rigveda.html'), 'utf8');
const doc = parseSaswaraRigvedaMandala(html, 2);
const padas = doc.sections[0].chunks.map((c) => devanagariToIast(c.sanskrit));

describe('parseSaswaraRigvedaMandala', () => {
  it('makes one section per sūkta, numbered from the mantra addresses', () => {
    expect(doc.id).toBe('saswara-rigveda-2');
    expect(doc.sections.map((s) => s.sectionNumber)).toEqual([23]);
    expect(padas).toHaveLength(6);
  });

  it('keeps the dīrgha svarita and ends each ṛk with its number', () => {
    expect(padas[0]).toBe('ga̠ṇānāṃ̎ tvā ga̠ṇapa̍tiṃ havāmahe ka̠viṃ ka̍vī̠nāmu̍pa̠maśra̍vastamam |');
    expect(padas[1].endsWith('sīda̠ sāda̍nam || 1 ||')).toBe(true);
  });

  it('drops the hiatus comma and marks the opening pada of each ṛk', () => {
    expect(padas[2].startsWith('de̠vāści̍tte asurya̠')).toBe(true);
    expect(doc.sections[0].chunks.map((c) => c.padya)).toEqual([1, undefined, 2, undefined, 3, undefined]);
  });
});
