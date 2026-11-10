import { decodeEntities, TAGS, ZERO_WIDTH } from './aranyaka';

/**
 * taittiriya.com cites a mantra given in full elsewhere by its opening words (a pratīka) followed by a
 * `§N` link to the page's appendix. These put the appendix text back in place of the pratīka, the way
 * it is chanted. Several numbers can share one appendix entry ("{66, 67}"), which is then inserted once.
 */
export type Expansions = Map<number, { entry: number; text: string }>;

const ENTRY = /<div class="expansion-entry" id="expansion-(\d+)">([\s\S]*?)(?=<div class="expansion-entry"|<\/section>|$)/g;
const ENTRY_TEXT = /<div class="expansion-content">[\s\S]*?<span class="script-devanagari">([\s\S]*?)<\/span>/;
const MARKER = /<span class="expansion-marker">[\s\S]*?#expansion-(\d+)[\s\S]*?<\/span>/g;

const clean = (html: string) => decodeEntities(html.replace(TAGS, '')).replace(ZERO_WIDTH, '').replace(/\s+/g, ' ').trim();
/** Text reduced so a pratīka matches its expansion across sandhi (नुकं / नुकव्ँ, प्रियम् / प्रियमभि). */
const bare = (s: string) => s.replace(/[\u0951\u0952\u1CDA\u094D\u0901\u0902\u0903\u2060\s।॥"“”]/g, '');

export function parseExpansions(html: string): Expansions {
  const map: Expansions = new Map();
  for (const m of html.matchAll(ENTRY)) {
    const text = ENTRY_TEXT.exec(m[2]);
    if (!text) continue;
    const entry = Number(m[1]);
    for (const id of [entry, ...[...m[2].matchAll(/id="expansion-(\d+)"/g)].map((x) => Number(x[1]))])
      map.set(id, { entry, text: clean(text[1]) });
  }
  return map;
}

/** A Devanagari block with each pratīka + `§N` replaced by the full text; an unmatched marker is dropped. */
export function expandBlock(blockHtml: string, expansions: Expansions): string {
  const pieces = blockHtml.split(MARKER);
  const out: string[] = [];
  let last = -1;
  for (let i = 0; i < pieces.length; i += 2) {
    let text = clean(pieces[i]);
    const n = Number(pieces[i + 1]);
    const exp = i + 1 < pieces.length ? expansions.get(n) : undefined;
    if (exp) {
      const words = text.split(' ');
      const full = bare(exp.text);
      const shared = exp.entry === last;
      const k = words.findIndex((_, j) => (shared ? full.includes.bind(full) : full.startsWith.bind(full))(bare(words.slice(j).join(' '))));
      if (k >= 0) text = [...words.slice(0, k), exp.entry === last ? '' : exp.text].join(' ').trim();
      last = exp.entry;
    }
    if (text) out.push(text);
  }
  return out.join(' ');
}
