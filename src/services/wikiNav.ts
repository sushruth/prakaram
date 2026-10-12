
export const HOME_HASH = '#/wiki';
export const REPO_URL = 'https://github.com/sushruth/prakaram';

export type Route =
  | { kind: 'player' }
  | { kind: 'home' }
  | { kind: 'article'; id: string; section?: number }
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

/** Maps a location hash to a wiki page. Anything outside `#/wiki` is the player. */
export function parseRoute(hash: string): Route {
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
  return section !== undefined && Number.isInteger(n) && n > 0
    ? { kind: 'article', id: dec(id), section: n }
    : { kind: 'article', id: dec(id) };
}

/** Ids and section numbers are encoded, so a `/` inside an id (a koshah piece id) cannot read as a section. */
export const articleHash = (id: string, section?: string | number) =>
  `#/wiki/${encodeURIComponent(id)}${section === undefined ? '' : `/${section}`}`;

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
