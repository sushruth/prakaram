import { describe, expect, it } from 'bun:test';
import { Glob } from 'bun';
import { readFileSync } from 'node:fs';
import { GLOSSARY, GLOSSARY_FILE } from '../services/glossary';

// Every <Term id> used in src exists in the glossary; every glossary term is complete; ids are unique.
describe('glossary', () => {
  it('has unique ids', () => {
    const ids = GLOSSARY_FILE.map((e) => e.id);
    expect(ids.filter((x, i) => ids.indexOf(x) !== i)).toEqual([]);
  });
  for (const e of Object.values(GLOSSARY)) {
    it(`term ${e.id} is complete`, () => {
      for (const k of ['id', 'sa', 'iast', 'gloss'] as const) expect(typeof e[k] === 'string' && e[k].trim().length > 0).toBe(true);
    });
  }
  it('file terms carry a note line', () => {
    expect(GLOSSARY_FILE.filter((e) => !e.note?.trim()).map((e) => e.id)).toEqual([]);
  });
  it('every <Term id> in src exists', () => {
    const used: string[] = [];
    for (const f of new Glob('src/**/*.tsx').scanSync('.')) {
      for (const m of readFileSync(f, 'utf8').matchAll(/<Term id="([^"]+)"/g)) used.push(m[1]);
    }
    expect(used.length).toBeGreaterThan(5);
    expect(used.filter((id) => !GLOSSARY[id])).toEqual([]);
  });
});
