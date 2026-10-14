
export const HOME_HASH = '#/wiki';
export const PLAYER_HASH = '#/player';
export const REPO_URL = 'https://github.com/sushruth/prakaram';

import { formatNirdesa, parseNirdesa, resolveNirdesa, type Pos } from './nirdesa';

export type Route =
  | { kind: 'player' }
  | { kind: 'home' }
  | { kind: 'article'; id: string; section?: number; /** Padas to mark, from `<s>.<a>-<b>`, `<s>.<l>` or a padya address (`<s>.p<n>`, resolved to its padas). */ range?: { from: Pos; to: Pos } }
  | { kind: 'category'; name: string }
  | { kind: 'search'; q: string }
  | { kind: 'random' }
  | { kind: 'compose' };

const dec = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

/** Maps a location hash to a wiki page. `#/player` (and anything else outside `#/wiki`) is the player. */
export function parseRoute(hash: string): Route {
  if (hash === PLAYER_HASH) return { kind: 'player' };
  const m = hash.match(/^#\/wiki(?:\/(.*))?$/);
  if (!m) return { kind: 'player' };
  const rest = m[1] ?? '';
  const qi = rest.indexOf('?');
  const path = qi < 0 ? rest : rest.slice(0, qi);
  const params = new URLSearchParams(qi < 0 ? '' : rest.slice(qi + 1));
  if (path === '') return { kind: 'home' };
  if (path === 'Special:Search') return { kind: 'search', q: params.get('q') ?? '' };
  if (path === 'Special:Compose') return { kind: 'compose' };
  if (path === 'Special:Random') return { kind: 'random' };
  if (path.startsWith('Category:')) return { kind: 'category', name: dec(path.slice('Category:'.length)) };
  const [id, section] = path.split('/');
  const n = Number(section);
  const addr = section !== undefined ? parseNirdesa(`x/${section}`) : null;
  if (addr?.padya) {
    // A padya address links to its padas; one that does not resolve still marks its section, with no range.
    const r = resolveNirdesa(`${dec(id)}/${section}`);
    return r.ok ? { kind: 'article', id: dec(id), section: addr.section, range: { from: r.first, to: r.last } } : { kind: 'article', id: dec(id), section: addr.section };
  }
  if (addr?.pada !== undefined) {
    const from = { section: addr.section!, pada: addr.pada };
    return { kind: 'article', id: dec(id), section: addr.section, range: { from, to: addr.to ?? from } };
  }
  return section !== undefined && Number.isInteger(n) && n > 0
    ? { kind: 'article', id: dec(id), section: n }
    : { kind: 'article', id: dec(id) };
}

/** Ids and section numbers are encoded, so a `/` inside an id (a koshah piece id) cannot read as a section. */
export const articleHash = (id: string, section?: string | number) =>
  `#/wiki/${encodeURIComponent(id)}${section === undefined ? '' : `/${section}`}`;

/** The wiki address of a nirdeśa: `#/wiki/<source>` or `#/wiki/<source>/<s>[.<a>[-<b>]]` or a padya step `<s>.p<n>`. */
export const nirdesaHash = (addr: string) => {
  const i = addr.indexOf('/');
  return i < 0 ? articleHash(addr) : `#/wiki/${encodeURIComponent(addr.slice(0, i))}/${addr.slice(i + 1)}`;
};

export const COMPOSE_HASH = '#/wiki/Special:Compose';

export const categoryHash = (name: string) => `#/wiki/Category:${encodeURIComponent(name)}`;

export const searchHash = (q: string) => `#/wiki/Special:Search?q=${encodeURIComponent(q)}`;

/** Old `#k=<docId>/<n>` links (the `/` may be `%2F`) become the wiki address of that document or section. */
export function legacyHash(hash: string): string | undefined {
  const m = hash.match(/^#k=(.+)$/);
  if (!m) return undefined;
  const [id, sec] = dec(m[1]).split('/');
  return articleHash(id, sec && /^\d+$/.test(sec) ? sec : undefined);
}

/** True when a linked range resolves in the corpus (sections and lines exist, not reversed); no range is fine. */
export const routeRangeOk = (id: string, range?: { from: Pos; to: Pos }) =>
  !range || resolveNirdesa(formatNirdesa({ source: id, ...range.from, ...(range.to.section !== range.from.section || range.to.pada !== range.from.pada ? { to: range.to } : {}) })).ok;
