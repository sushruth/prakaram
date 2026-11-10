import { describe, expect, it } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { devanagariToIast, iastToDevanagari } from '../../src/services/transliteration/iastCodec';

const SOURCES_DIR = join(import.meta.dir, '../../sources');
const INDIC = /[ऀ-ॿ꣠-ꣿ᳐-᳿]/;

function collect(value: unknown, out: string[]): void {
  if (Array.isArray(value)) value.forEach((v) => collect(v, out));
  else if (value && typeof value === 'object')
    for (const [key, v] of Object.entries(value)) {
      if (key === 'sanskrit' && typeof v === 'string') out.push(v);
      else collect(v, out);
    }
}

function sanskritStrings(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) sanskritStrings(path, out);
    else if (name.endsWith('.json')) collect(JSON.parse(readFileSync(path, 'utf8')), out);
  }
  return out;
}

describe('iastCodec', () => {
  it('round-trips every sanskrit string in sources/ and leaves no Indic character in the IAST', () => {
    const strings = sanskritStrings(SOURCES_DIR);
    expect(strings.length).toBeGreaterThan(0);
    const lossy = strings.filter((s) => iastToDevanagari(devanagariToIast(s)) !== s);
    const indic = strings.map(devanagariToIast).filter((s) => INDIC.test(s));
    expect(lossy.slice(0, 5)).toEqual([]);
    expect(indic.slice(0, 5)).toEqual([]);
  });

  it('separates the readings plain IAST cannot tell apart', () => {
    for (const s of ['क्ह', 'ख', 'कइ', 'कै', 'कउ', 'कौ', 'क्अ', 'क', '।।', '॥', 'ओं', 'ॐ', 'द्ः', '१2', '2१', 'ड्ह', 'ष\u0951\u0952', 'ष\u0952\u0951', 'का\u0952']) {
      expect(iastToDevanagari(devanagariToIast(s))).toBe(s);
      expect(iastToDevanagari(devanagariToIast(s).normalize('NFD'))).toBe(s);
    }
  });

  it('writes the agreed tokens', () => {
    expect(devanagariToIast('अ॒ग्निमी॑ळे')).toBe('a̠gnimī̍ḷe');
    expect(devanagariToIast('तꣳ स॒ꣴ')).toBe('tagͫ sa̠gͫͫ');
    expect(devanagariToIast('ऌ ॡ ऴ ॐ ॥ १')).toBe('l̥ l̥̄ ḻa ōṃ || 1');
    expect(devanagariToIast('§36')).toBe('§·36·');
  });

  it('reads typed IAST in NFC or NFD, any case', () => {
    const title = 'Śrī Kṛṣṇa Vṛndāvana Prayāṇam';
    expect(iastToDevanagari(title)).toBe('श्री कृष्ण वृन्दावन प्रयाणम्');
    expect(iastToDevanagari(title.normalize('NFD'))).toBe('श्री कृष्ण वृन्दावन प्रयाणम्');
    expect(iastToDevanagari('kalaśārādhanaṁ')).toBe('कलशाराधनं');
  });
});
