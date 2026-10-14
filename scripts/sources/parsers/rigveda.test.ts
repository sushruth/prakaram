import { describe, expect, it } from 'bun:test';
import { padyas } from '../../../src/services/padya';
import { parseRigvedaMandala, type RigvedaRecord } from './rigveda';

const COMMIT = '96b3bafd47ffbfe1902f3f0ef7a1928dd43c34d7';

const FIXTURE: RigvedaRecord[] = [
  {
    veda: 'rigveda',
    mandala: 1,
    sukta: 1,
    text: '९ मधुच्छन्दा वैश्वामित्रः। अग्निः। गायत्री।\n\nअ॒ग्निमी॑ळे पु॒रोहि॑तं य॒ज्ञस्य॑ दे॒वमृ॒त्विज॑म्। होता॑रं रत्न॒धात॑मम्॥१॥\n\nअ॒ग्निः पूर्वे॑भि॒र्ऋषि॑भि॒रीड्यो॒ नूत॑नैरु॒त। स दे॒वाँ एह व॑क्षति॥२॥\n\nअ॒ग्निना॑ र॒यिम॑श्नव॒त् पोष॑मे॒व दि॒वेदि॑वे। य॒शसं॑ वी॒रव॑त्तमम्॥३॥',
  },
  {
    veda: 'rigveda',
    mandala: 1,
    sukta: 2,
    // A header that wraps over two blocks, and a verse whose numeral lacks the closing daṇḍa.
    text: '१२ मधुच्छन्दा वैश्वामित्रः। १-३ अश्विनौ,\n\n४-६ इन्द्र। गायत्री।\n\nअश्वि॑ना॒ यज्व॑री॒रिषो॒ द्रव॑त्पाणी॒ शुभ॑स्पती। पुरु॑भुजा चन॒स्यत॑म्॥१\n\nअश्वि॑ना॒ पुरु॑दंससा॒ नरा॒ शवी॑रया धि॒या। धिष्ण्या॒ वन॑तं॒ गिर॑:॥२॥\n\n॥इति प्रथमं मण्डलं समाप्तम्॥',
  },
  {
    veda: 'rigveda',
    mandala: 2,
    sukta: 1,
    text: '९ मधुच्छन्दा वैश्वामित्रः। वायुः। गायत्री।\n\nवाय॒वा या॑हि दर्शते॒मे सोमा॒ अरं॑कृताः। तेषां॑ पाहि श्रु॒धी हव॑म्॥१॥',
  },
  {
    veda: 'rigveda',
    mandala: 4,
    sukta: 1,
    text: '९ मधुच्छन्दा वैश्वामित्रः। अग्निः। गायत्री।\n\nअ॒ग्निमी॑ळे पु॒रोहि॑तं य॒ज्ञस्य॑ दे॒वमृ॒त्विज॑म्। होता॑रं रत्न॒धात॑मम्॥१॥',
  },
];

describe('parseRigvedaMandala', () => {
  const doc = parseRigvedaMandala(FIXTURE, 1);

  it('is one document per mandala, with the source metadata', () => {
    expect(doc.id).toBe('rigveda-1');
    expect(doc.metadata.kind).toBe('source');
    expect(doc.metadata.veda).toBe('rigveda');
    expect(doc.metadata.place).toEqual({ work: { sanskrit: 'ऋग्वेद', english: 'Ṛgveda' }, divisions: [{ kind: 'maṇḍala', n: 1 }] });
    expect(doc.metadata.remoteUrl).toBe(`https://github.com/bhavykhatri/DharmicData/blob/${COMMIT}/Rigveda/rigveda_mandala_1.json`);
    expect(doc.metadata.license).toContain('Open Database License (ODbL)');
  });

  it('makes one section per sūkta, numbered by the sūkta, and ignores other mandalas', () => {
    expect(doc.sections.map((s) => s.sectionNumber)).toEqual([1, 2]);
    expect(doc.sections.map((s) => s.id)).toEqual(['rigveda-1-1', 'rigveda-1-2']);
    expect(doc.sections[0].title).toBe('Maṇḍala 1 · Sūkta 1');
    expect(doc.sections.flatMap((s) => s.chunks).some((c) => c.sanskrit.includes('वाय॒वा'))).toBe(false);
  });

  it('drops the header and splits each verse at its daṇḍas into padas', () => {
    expect(doc.sections[0].chunks.map((c) => c.sanskrit)).toEqual([
      'अ॒ग्निमी॑ळे पु॒रोहि॑तं य॒ज्ञस्य॑ दे॒वमृ॒त्विज॑म्।',
      'होता॑रं रत्न॒धात॑मम्॥ १ ॥',
      'अ॒ग्निः पूर्वे॑भि॒र्ऋषि॑भि॒रीड्यो॒ नूत॑नैरु॒त।',
      'स दे॒वाँ एह व॑क्षति॥ २ ॥',
      'अ॒ग्निना॑ र॒यिम॑श्नव॒त् पोष॑मे॒व दि॒वेदि॑वे।',
      'य॒शसं॑ वी॒रव॑त्तमम्॥ ३ ॥',
    ]);
    expect(doc.sections.flatMap((s) => s.chunks).some((c) => /मधुच्छन्दा|गायत्री/.test(c.sanskrit))).toBe(false);
  });

  it('assigns each printed numeral to the pada that opens its verse, and the section to the first', () => {
    const [s1, s2] = doc.sections;
    expect(s1.chunks.map((c) => c.padya)).toEqual([1, undefined, 2, undefined, 3, undefined]);
    expect(s2.chunks.map((c) => c.padya)).toEqual([1, undefined, 2, undefined]);
    expect(s1.chunks[0].section).toBe(1);
    expect(s1.chunks[1].section).toBeUndefined();
    // The derived padya level agrees, so the player and the wiki see the same verses.
    expect(padyas(s1)).toEqual([
      { number: 1, from: 1, to: 2 },
      { number: 2, from: 3, to: 4 },
      { number: 3, from: 5, to: 6 },
    ]);
  });

  it('keeps swara codepoints exactly, and drops the closing colophon', () => {
    expect(doc.sections[1].chunks.map((c) => c.sanskrit)).toEqual([
      'अश्वि॑ना॒ यज्व॑री॒रिषो॒ द्रव॑त्पाणी॒ शुभ॑स्पती।',
      'पुरु॑भुजा चन॒स्यत॑म्॥ १ ॥',
      'अश्वि॑ना॒ पुरु॑दंससा॒ नरा॒ शवी॑रया धि॒या।',
      'धिष्ण्या॒ वन॑तं॒ गिर॑:॥ २ ॥',
    ]);
    for (const c of doc.sections.flatMap((s) => s.chunks)) expect(/[\u0951\u0952\u1CDA]/.test(c.sanskrit)).toBe(true);
    expect(doc.sections.flatMap((s) => s.chunks).some((c) => c.sanskrit.includes('समाप्तम्'))).toBe(false);
  });
});
