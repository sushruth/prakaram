// Usage: bun scripts/vignanamToDocument.ts <page-slug> <out.json> <id> <idPrefix>
// Fetches a Devanagari page from vignanam.org (e.g. sri-rudram-namakam) and turns its #stext
// into a MantraDocument skeleton: one chunk per printed line, a line ending "॥ N ॥" closes a section.
// Writes only id and sections; add title and metadata by hand before registering (MAINTAINERS.md §4a).
// Vignanam text is reused while permission is discussed with them; keep the document at draft status.
const [slug, out, id, prefix] = process.argv.slice(2);

const res = await fetch(`https://vignanam.org/devanagari/${slug}.html`, {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  },
});
if (!res.ok) throw new Error(`fetch failed: ${res.status} for ${slug}`);
const html = await res.text();

const start = html.indexOf('id="stext"');
if (start < 0) throw new Error('no #stext found');
const text = html
  .slice(html.indexOf('>', start) + 1, html.indexOf('</div>', start))
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/[​‌‍]/g, '')
  .normalize('NFC');

const rawLines = text
  .split('\n')
  .map((l) => l.trim().replace(/\s{2,}/g, ' '))
  .filter(Boolean);
const end = rawLines.findIndex((l) => l.startsWith('Browse Related Categories'));
const body = end >= 0 ? rawLines.slice(0, end) : rawLines;
const first = body.findIndex((l) => /[॒॑᳚]/.test(l) || /^[ॐओ]/.test(l));
const lines = first >= 0 ? body.slice(first) : body;

const sections: { title: string; chunks: { id: string; chunkNumber: number; sanskrit: string }[] }[] = [];
let current: (typeof sections)[number] = { title: 'Anuvaka 1', chunks: [] };
let n = 0;
for (const line of lines) {
  n++;
  current.chunks.push({ id: `${prefix}-${sections.length + 1}-${current.chunks.length + 1}`, chunkNumber: n, sanskrit: line });
  if (/॥\s*\d+\s*॥$/.test(line)) {
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
await Bun.write(out, JSON.stringify(doc, null, 2) + '\n');
console.log(`${sections.length} sections, ${n} lines`);

export {};
