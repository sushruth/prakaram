import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type BasketItem, migrateBasket, moveItem } from '../services/basket';

interface BasketState {
  /** Nirdeśa strings (a piece id is one). */
  items: BasketItem[];
  add: (nirdesa: string) => void;
  remove: (nirdesa: string) => void;
  /** Moves an item one step up (-1) or down (+1). */
  move: (nirdesa: string, by: -1 | 1) => void;
  clear: () => void;
}

export const useBasketStore = create<BasketState>()(
  persist(
    (set) => ({
      items: [],
      add: (a) => set((s) => (s.items.includes(a) ? s : { items: [...s.items, a] })),
      remove: (a) => set((s) => ({ items: s.items.filter((i) => i !== a) })),
      move: (a, by) => set((s) => ({ items: moveItem(s.items, a, by) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'prakaram-basket',
      version: 2,
      partialize: (s) => ({ items: s.items }),
      merge: (persisted, current) => {
        const raw = (persisted as { items?: unknown } | null)?.items;
        const items = migrateBasket(raw);
        return { ...current, items };
      },
    },
  ),
);
