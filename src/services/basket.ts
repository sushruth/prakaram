import type { Prakara } from '../types/mantra';
import { formatNirdesa, normaliseNirdesa, rangeWords, resolveNirdesa } from './nirdesa';

/** A basket item is a nirdeśa string: a whole source, a section, a line or a range of lines. */
export type BasketItem = string;

/** Moves an item one step up (-1) or down (+1); out of range leaves the list as is. */
export function moveItem(items: BasketItem[], item: BasketItem, by: -1 | 1): BasketItem[] {
  const from = items.indexOf(item);
  const to = from + by;
  if (from < 0 || to < 0 || to >= items.length) return items;
  const next = [...items];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/** A prakara that chants the basket's nirdeśas in order; a section or range item runs only those lines. */
export function basketToPrakara(items: BasketItem[], title: string, now = Date.now()): Prakara {
  return {
    id: `basket-${now}`,
    title: title.trim() || 'My prakaram',
    description: 'Composed from the wiki',
    createdTimestamp: now,
    items: items.flatMap((addr, i) => {
      const r = resolveNirdesa(addr);
      if (!r.ok) return [];
      const n = r.nirdesa;
      const whole = n.section === undefined;
      const doc = r.document.title.english;
      const customTitle = whole ? doc : n.line === undefined ? `${doc}: ${r.sections[0].title}` : `${doc}: ${n.to && n.to.section !== n.section ? rangeWords(n) : `§${n.section} ${rangeWords(n)}`}`;
      return [{ id: `b${i}-${addr}`, type: 'sukta_ref' as const, suktaId: r.document.id, ...(whole ? {} : { nirdesa: formatNirdesa(n) }), customTitle }];
    }),
  };
}

/** Reads a stored basket: nirdeśa strings, or version 1's `{ pieceId }` objects (piece ids are nirdeśas). Drops anything unresolvable and duplicates. */
export function migrateBasket(raw: unknown): BasketItem[] {
  const seen = new Set<string>();
  return (Array.isArray(raw) ? raw : []).flatMap((i): BasketItem[] => {
    const s = typeof i === 'string' ? i : (i as { pieceId?: unknown } | null)?.pieceId;
    const a = typeof s === 'string' ? normaliseNirdesa(s) : undefined;
    if (!a || seen.has(a) || !resolveNirdesa(a).ok) return [];
    seen.add(a);
    return [a];
  });
}

/** zustand persist `migrate`: any older stored shape (v1 `{ items: [{ pieceId }] }`) becomes nirdeśa strings. Without it zustand drops a stale-version state. */
export const migrateStoredBasket = (persisted: unknown): { items: BasketItem[] } => ({ items: migrateBasket((persisted as { items?: unknown } | null)?.items) });

/** zustand persist `merge`: tolerant of a missing or malformed stored state. */
export const mergeStoredBasket = <T extends { items: BasketItem[] }>(persisted: unknown, current: T): T => ({ ...current, ...migrateStoredBasket(persisted) });
