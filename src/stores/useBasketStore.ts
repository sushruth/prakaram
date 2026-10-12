import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ALL_SUKTAMS } from '../data';
import { findPiece } from '../services/koshah';
import { type BasketItem, moveItem } from '../services/basket';

interface BasketState {
  items: BasketItem[];
  add: (pieceId: string) => void;
  remove: (pieceId: string) => void;
  /** Moves an item one step up (-1) or down (+1). */
  move: (pieceId: string, by: -1 | 1) => void;
  clear: () => void;
}

export const useBasketStore = create<BasketState>()(
  persist(
    (set) => ({
      items: [],
      add: (pieceId) => set((s) => (s.items.some((i) => i.pieceId === pieceId) ? s : { items: [...s.items, { pieceId }] })),
      remove: (pieceId) => set((s) => ({ items: s.items.filter((i) => i.pieceId !== pieceId) })),
      move: (pieceId, by) => set((s) => ({ items: moveItem(s.items, pieceId, by) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'prakaram-basket',
      version: 1,
      partialize: (s) => ({ items: s.items }),
      merge: (persisted, current) => {
        const raw = (persisted as { items?: unknown } | null)?.items;
        const seen = new Set<string>();
        const items = (Array.isArray(raw) ? raw : []).flatMap((i): BasketItem[] => {
          const id = (i as BasketItem | null)?.pieceId;
          if (typeof id !== 'string' || seen.has(id) || !findPiece(ALL_SUKTAMS, id)) return [];
          seen.add(id);
          return [{ pieceId: id }];
        });
        return { ...current, items };
      },
    },
  ),
);
