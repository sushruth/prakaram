/**
 * The articles a reader actually opened, kept most-recent-first. Pure helpers, so the reducer can be
 * tested without the persisted store; `useRecentStore` wraps them.
 */

/** How many recently opened articles the home remembers. */
export const MAX_RECENT = 12;

/** Records an opened article: most-recent-first, deduped, capped at `MAX_RECENT`. An already-listed id moves to the front. */
export function recordRecent(ids: readonly string[], id: string): string[] {
  const next = id.trim();
  if (!next) return [...ids];
  return [next, ...ids.filter((x) => x !== next)].slice(0, MAX_RECENT);
}
