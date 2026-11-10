import { describe, expect, it } from 'bun:test';
import { devanagariToIast, iastToDevanagari } from '../../../src/services/transliteration/iastCodec';
import { parseNamasteAstu } from './namasteAstu';

const d = iastToDevanagari;
const page = `<pre id="content">${d('atho ya iṣudhistavāre asmannidhehi tam || ')}१.१५॥\n${d('namaste astu bhagavan\nviśveśvarāya namaḥ || ')}२.०॥\n${d('namo hiraṇyabāhave')}</pre>`;

describe('parseNamasteAstu', () => {
  it('takes only the passage between 1.15 and 2.0, as one pada', () => {
    const chunks = parseNamasteAstu(page).sections[0].chunks;
    expect(chunks.map((c) => devanagariToIast(c.sanskrit))).toEqual(['namaste astu bhagavan viśveśvarāya namaḥ ||']);
  });
});
