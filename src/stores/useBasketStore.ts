import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type BasketItem, mergeStoredBasket, migrateStoredBasket, moveItem } from '../services/basket';

interface BasketState {
  /** Nirdeśa strings (a piece id is one). */
  items: BasketItem[];
  /** Optional kriyā names (free text, e.g. 'kalaśārādhanaṁ') by address. */
  names: Record<string, string>;
  add: (nirdesa: string) => void;
  remove: (nirdesa: string) => void;
  /** Moves an item one place up (-1) or down (+1). */
  move: (nirdesa: string, by: -1 | 1) => void;
  setName: (nirdesa: string, name: string) => void;
  clear: () => void;
}

export const useBasketStore = create<BasketState>()(
  persist(
    (set) => ({
      items: [],
      names: {},
      add: (a) => set((s) => (s.items.includes(a) ? s : { items: [...s.items, a] })),
      remove: (a) => set((s) => ({ items: s.items.filter((i) => i !== a), names: Object.fromEntries(Object.entries(s.names).filter(([k]) => k !== a)) })),
      move: (a, by) => set((s) => ({ items: moveItem(s.items, a, by) })),
      setName: (a, name) => set((s) => ({ names: { ...s.names, [a]: name } })),
      clear: () => set({ items: [], names: {} }),
    }),
    {
      name: 'prakaram-basket',
      version: 2,
      partialize: (s) => ({ items: s.items, names: s.names }),
      migrate: migrateStoredBasket,
      merge: mergeStoredBasket,
    },
  ),
);
