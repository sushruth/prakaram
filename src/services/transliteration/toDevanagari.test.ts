import { describe, expect, it } from 'bun:test';
import { devanagariToIast } from './iastCodec';
import { displayToDevanagari, sanskritFieldToDevanagari, sourceToDevanagari } from './toDevanagari';

describe('toDevanagari', () => {
  it('converts IAST runs in code text and leaves English and Devanagari alone', () => {
    expect(displayToDevanagari('Ganesha Suktam · ā tū na indra')).toBe('Ganesha Suktam · आ तू न इन्द्र');
    expect(displayToDevanagari('Śrī Kṛṣṇa Vṛndāvana Prayāṇam')).toBe('श्री कृष्ण वृन्दावन प्रयाणम्');
    expect(displayToDevanagari('Custom Vakya')).toBe('Custom Vakya');
    expect(displayToDevanagari('गणपति ā')).toBe('गणपति ā');
  });

  it('reads a Sanskrit-only field as IAST unless it holds Indic script', () => {
    const line = 'अ॒ग्निमी॑ळे पु॒रोहि॑तं ॥ १ ॥';
    expect(sanskritFieldToDevanagari(line)).toBe(line);
    expect(sanskritFieldToDevanagari(devanagariToIast(line))).toBe(line);
  });

  it('converts every sanskrit string of a loaded source, nested or not', () => {
    const part = { title: { sanskrit: 'ṛgveda', english: 'Ṛgveda' }, sections: [{ chunks: [{ sanskrit: devanagariToIast('अ॒ग्निमी॑ळे'), translation: 'Agni' }] }] };
    expect(sourceToDevanagari(part)).toEqual({
      title: { sanskrit: 'ऋग्वेद', english: 'Ṛgveda' },
      sections: [{ chunks: [{ sanskrit: 'अ॒ग्निमी॑ळे', translation: 'Agni' }] }],
    });
  });
});
