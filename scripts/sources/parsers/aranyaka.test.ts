import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseAranyaka } from './aranyaka';

const FIXTURE = readFileSync(join(import.meta.dir, 'fixtures', 'aranyaka.html'), 'utf8');

describe('parseAranyaka', () => {
  const doc = parseAranyaka(FIXTURE, 3);

  it('is one document per prapāṭhaka, with the source metadata', () => {
    expect(doc.id).toBe('taittiriya-aranyaka-3');
    expect(doc.metadata.kind).toBe('source');
    expect(doc.metadata.veda).toBe('yajurveda');
    expect(doc.metadata.place).toEqual({ work: { sanskrit: 'तैत्तिरीय आरण्यक', english: 'Taittirīya Āraṇyaka' }, divisions: [{ kind: 'prapāṭhaka', n: 3 }] });
    expect(doc.metadata.remoteUrl).toBe('https://taittiriya.com/aranyaka/prapathaka_3');
    expect(doc.metadata.source).toContain('taittiriya.com');
    expect(doc.metadata.license).toContain('taittiriya.com');
    expect(doc.metadata.status).toBe('draft');
  });

  it('takes one section per anuvāka, numbered by its printed numeral (else its id)', () => {
    // anuvaka-3 prints no number, so its id (3) is used; anuvaka-15 prints १५.
    expect(doc.sections.map((s) => s.sectionNumber)).toEqual([1, 2, 3, 15]);
    expect(doc.sections.map((s) => s.id)).toEqual([
      'taittiriya-aranyaka-3-1',
      'taittiriya-aranyaka-3-2',
      'taittiriya-aranyaka-3-3',
      'taittiriya-aranyaka-3-15',
    ]);
    expect(doc.sections.map((s) => s.chunks.length)).toEqual([2, 2, 1, 1]);
  });

  it('splits each anuvāka into padas at its daṇḍas, marking the first with the section', () => {
    expect(doc.sections[0].chunks.map((c) => c.sanskrit)).toEqual([
      'अ॒ग्निमी॑ळे पु॒रोहि॑तं य॒ज्ञस्य॑ दे॒वमृ॒त्विज॑म्।',
      'होता॑रं रत्न॒धात॑मम्॥',
    ]);
    expect(doc.sections[0].chunks[0].section).toBe(1);
    expect(doc.sections[0].chunks[1].section).toBeUndefined();
  });

  it('keeps swara, decodes entities and drops zero-width characters', () => {
    const second = doc.sections[1].chunks.map((c) => c.sanskrit);
    // `&#x1CDA;` decodes to the dīrgha svarita; the ZWNJ after `आज्य᳚म्` is dropped.
    expect(second).toEqual(['वाग्वेदिः॑᳚।', 'चि॒त्तमा॑ज्य᳚म्।']);
    for (const c of doc.sections.flatMap((s) => s.chunks)) expect(/[\u0951\u0952\u1CDA]/.test(c.sanskrit)).toBe(true);
  });

  it('takes only the Devanagari block, ignoring the other four scripts and the number markers', () => {
    const text = doc.sections.flatMap((s) => s.chunks).map((c) => c.sanskrit).join(' ');
    expect(text).not.toMatch(/ಕನ್ನಡ|తెలుగు|தமிழ்|𑌗𑍍𑌨𑌥/);
    expect(text).not.toMatch(/३३|३४|१०/);
  });
});
