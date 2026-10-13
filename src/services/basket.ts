import type { Prakara } from '../types/mantra';
import { formatNirdesa, normaliseNirdesa, partWords, resolveNirdesa } from './nirdesa';

/** A basket item is a nirdeśa string: a whole source, a section, a line or a range of lines. */
export type BasketItem = string;

/** Moves an item one place up (-1) or down (+1); out of range leaves the list as is. */
export function moveItem(items: BasketItem[], item: BasketItem, by: -1 | 1): BasketItem[] {
  const from = items.indexOf(item);
  const to = from + by;
  if (from < 0 || to < 0 || to >= items.length) return items;
  const next = [...items];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/** '<kriyaName> kariṣye': the sankalpa line of a kriyā named by the user. */
export const sankalpaOf = (kriyaName: string) => `${kriyaName.trim()} kariṣye`;

/** A prakara that chants the basket's nirdeśas in order; a section or range kriyā runs only those padas. `names` holds the optional kriyā names by address. */
export function basketToPrakara(items: BasketItem[], title: string, now = Date.now(), names: Record<string, string> = {}): Prakara {
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
      const sectionOnly = n.section !== undefined && n.pada === undefined && !n.padya;
      const customTitle = whole ? doc : sectionOnly ? `${doc}: ${r.sections[0].title}` : `${doc}: ${partWords(n)}`;
      const kriyaName = (whole || sectionOnly ? names[addr] : undefined)?.trim();
      return [{ id: `b${i}-${addr}`, type: 'sukta_ref' as const, suktaId: r.document.id, ...(whole ? {} : { nirdesa: formatNirdesa(n) }), customTitle, ...(kriyaName ? { kriyaName, sankalpa: sankalpaOf(kriyaName) } : {}) }];
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
export const migrateStoredBasket = (persisted: unknown): { items: BasketItem[]; names: Record<string, string> } => {
  const p = persisted as { items?: unknown; names?: unknown } | null;
  const items = migrateBasket(p?.items);
  const raw = (typeof p?.names === 'object' && p.names !== null ? p.names : {}) as Record<string, unknown>;
  const names = Object.fromEntries(items.flatMap((i) => (typeof raw[i] === 'string' && (raw[i] as string).trim() ? [[i, (raw[i] as string).trim()]] : [])));
  return { items, names };
};

/** zustand persist `merge`: tolerant of a missing or malformed stored state. */
export const mergeStoredBasket = <T extends { items: BasketItem[] }>(persisted: unknown, current: T): T => ({ ...current, ...migrateStoredBasket(persisted) });
