import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { padyas } from '../../../src/services/padya';
import { parseSri } from './sri';

const FIXTURE = readFileSync(join(import.meta.dir, 'fixtures', 'sri.html'), 'utf8');

describe('parseSri', () => {
  const doc = parseSri(FIXTURE);

  it('is the Śrī Sūkta as a source, with its place and upstream page', () => {
    expect(doc.id).toBe('rigveda-khila-sri');
    expect(doc.metadata.kind).toBe('source');
    expect(doc.metadata.veda).toBe('rigveda');
    expect(doc.metadata.place).toEqual({ work: { sanskrit: 'ऋग्वेद खिल', english: 'Ṛgveda (Khila)' }, divisions: [{ kind: 'khaṇḍa', n: 2 }, { kind: 'sūkta', n: 6 }] });
    expect(doc.metadata.remoteUrl).toBe('https://sanskritdocuments.org/doc_veda/s-sukta-accent.html');
    expect(doc.metadata.source).toContain('sanskritdocuments.org');
    expect(doc.metadata.license).toContain('sanskritdocuments.org');
    expect(doc.metadata.status).toBe('draft');
  });

  it('is one section of padas, one pada per daṇḍa', () => {
    expect(doc.sections).toHaveLength(1);
    expect(doc.sections[0].sectionNumber).toBe(1);
    expect(doc.sections[0].id).toBe('rigveda-khila-sri-1');
    expect(doc.sections[0].chunks.map((c) => c.sanskrit)).toEqual([
      'ॐ ॥',
      'हिर॑ण्यवर्णां॒ हरि॑णीं सु॒वर्ण॑रज॒तस्र॑जाम् ।',
      'च॒न्द्रां हि॒रण्म॑यीं ल॒क्ष्मीं जात॑वेदो म॒ आव॑ह ॥ १॥',
      'तां म॒ आव॑ह॒ जात॑वेदो ल॒क्ष्मीमन॑पगा॒मिनी᳚म् ।',
      'यस्यां॒ हिर॑ण्यं वि॒न्देयं॒ गामश्वं॒ पुरु॑षान॒हम् ॥ २॥',
      'प॒द्मा॒न॒ने प॑द्म ऊ॒रू॒ प॒द्माक्षी॑ पद्म॒सम्भ॑वे ।',
      'त्वं मां᳚ भ॒जस्व॑ प॒द्मा॒क्षी॒ ये॒न सौ᳚ख्यं ल॒भाम्य॑हम् ॥',
      'ॐ शान्तिः॒ शान्तिः॒ शान्तिः॑ ॥',
    ]);
  });

  it('keeps swara, decodes entities and drops zero-width characters', () => {
    const second = doc.sections[0].chunks[3].sanskrit;
    // `&#x1CDA;` decodes to the dīrgha svarita; the `&#x200c;` (ZWNJ) is dropped.
    expect(second).toBe('तां म॒ आव॑ह॒ जात॑वेदो ल॒क्ष्मीमन॑पगा॒मिनी᳚म् ।');
    expect(second).toContain('\u1CDA');
    expect(second).not.toContain('\u200c');
  });

  it('drops the h2 heading, the phalaśruti label, the colophon and the credits', () => {
    const text = doc.sections[0].chunks.map((c) => c.sanskrit).join(' ');
    for (const gone of ['श्रीसूक्त (ऋग्वेद)', 'फलश्रुति', 'श्रीसूक्तोपनिषद्', 'Encoded and proofread']) expect(text).not.toContain(gone);
    // The phalaśruti verses themselves are kept.
    expect(text).toContain('प॒द्मा॒न॒ने');
  });

  it('keeps the printed numerals, so the ṛk level derives from them', () => {
    expect(padyas(doc.sections[0])?.map((p) => p.number)).toEqual([1, 2]);
  });
});
