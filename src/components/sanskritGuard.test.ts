import { describe, expect, it } from 'bun:test';
import { Glob } from 'bun';
import { readFileSync } from 'node:fs';

// Sanskrit/Vedic text is rendered only through components/Sanskrit.tsx so it always follows the selected script.
const ALLOWED = ['Sanskrit.tsx', 'renderVedic.tsx'];
const BAD: [string, RegExp][] = [
  ['imports transliterateVedic', /\btransliterateVedic\b/],
  ['imports renderVedic', /from ['"]\.\/renderVedic['"]/],
  ['reads title.sanskrit', /\btitle\.sanskrit\b/],
  ['uses articleLabel', /\barticleLabel\b/],
];

describe('single Sanskrit entry point', () => {
  const files = [...new Glob('src/components/**/*.tsx').scanSync('.')].filter((f) => !ALLOWED.some((a) => f.endsWith('/' + a)));
  it('scans components', () => expect(files.length).toBeGreaterThan(10));
  for (const f of files) {
    it(f, () => {
      const src = readFileSync(f, 'utf8');
      for (const [what, re] of BAD) expect(re.test(src) ? `${f} ${what}` : '').toBe('');
    });
  }
});
