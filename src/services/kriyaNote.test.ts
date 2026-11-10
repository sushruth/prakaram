import { describe, expect, it } from 'bun:test';
import { normalizePrakara } from './koshah';

describe('kriyā note', () => {
  const prakara = (note: unknown) => ({ id: 'p', title: 't', description: '', createdTimestamp: 0, items: [{ id: 'v', type: 'vakya', customText: 'x', note }] });

  it('keeps a text note through load', () => {
    expect(normalizePrakara(prakara('Some editions start later.'))?.items[0].note).toBe('Some editions start later.');
  });

  it('drops a note that is not text', () => {
    expect(normalizePrakara(prakara(42))?.items[0]).not.toHaveProperty('note');
  });
});
