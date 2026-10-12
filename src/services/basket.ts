import type { Prakara } from '../types/mantra';
import { ALL_SUKTAMS } from '../data';
import { findPiece } from './koshah';

export interface BasketItem {
  pieceId: string;
}

/** Moves an item one step up (-1) or down (+1); out of range leaves the list as is. */
export function moveItem(items: BasketItem[], pieceId: string, by: -1 | 1): BasketItem[] {
  const from = items.findIndex((i) => i.pieceId === pieceId);
  const to = from + by;
  if (from < 0 || to < 0 || to >= items.length) return items;
  const next = [...items];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/** A prakara that chants the basket's pieces in order; a section piece runs only that section. */
export function basketToPrakara(items: BasketItem[], title: string, now = Date.now()): Prakara {
  return {
    id: `basket-${now}`,
    title: title.trim() || 'My prakaram',
    description: 'Composed from the wiki',
    createdTimestamp: now,
    items: items.flatMap((b, i) => {
      const piece = findPiece(ALL_SUKTAMS, b.pieceId);
      return piece
        ? [{ id: `b${i}-${b.pieceId}`, type: 'sukta_ref' as const, suktaId: piece.documentId, sectionId: piece.sectionId, customTitle: piece.title.english }]
        : [];
    }),
  };
}
