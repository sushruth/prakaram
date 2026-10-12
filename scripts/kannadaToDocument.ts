// Usage: bun scripts/kannadaToDocument.ts <input.txt> <out.json> <id> <idPrefix>
// Turns a saswara Kannada-script text (one verse line per line, "॥ N ॥" ends a section) into a MantraDocument
// with Devanagari source. Kannada and Devanagari share their block layout 0x380 apart; swara marks are shared.
import { readFileSync, writeFileSync } from 'node:fs';

const [input, out, id, prefix] = process.argv.slice(2);

const toDevanagari = (s: string) =>
  [...s.replace(/[​‌‍]/g, '')]
    .map((ch) => {
      const cp = ch.codePointAt(0)!;
      if (cp >= 0x0c80 && cp <= 0x0cff) return String.fromCodePoint(cp - 0x380);
      if (cp >= 0x30 && cp <= 0x39) return String.fromCodePoint(0x0966 + cp - 0x30);
      return ch;
    })
    .join('')
    .replace(/(^|\s)ओं(?=\s|$)/g, '$1ॐ');

const lines = readFileSync(input, 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => ({ raw: l, dev: toDevanagari(l).replace(/\s{2,}/g, ' ') }));

const sections: { title: string; chunks: { id: string; chunkNumber: number; sanskrit: string }[] }[] = [];
let current: (typeof sections)[number] = { title: 'Anuvaka 1', chunks: [] };
let n = 0;
for (const { raw, dev } of lines) {
  n++;
  current.chunks.push({ id: `${prefix}-${sections.length + 1}-${current.chunks.length + 1}`, chunkNumber: n, sanskrit: dev });
  if (/॥ \d+ ॥$/.test(raw)) {
    sections.push(current);
    current = { title: `Anuvaka ${sections.length + 1}`, chunks: [] };
  }
}
if (current.chunks.length) {
  current.title = 'Concluding mantras';
  sections.push(current);
}

const doc = {
  id,
  sections: sections.map((s, i) => ({ id: `${id}-${i + 1}`, title: s.title, sectionNumber: i + 1, chunks: s.chunks })),
};
writeFileSync(out, JSON.stringify(doc, null, 2) + '\n');
console.log(`${sections.length} sections, ${n} lines`);
