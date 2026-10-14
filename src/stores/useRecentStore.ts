import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MAX_RECENT, recordRecent } from '../services/recent';
import { stringList } from './persistence';

interface RecentState {
  /** Article ids the reader opened, most recent first. */
  ids: string[];
  /** Record an opened article. Ignored for a blank id; an already-listed id moves to the front. */
  record: (id: string) => void;
  clear: () => void;
}

/**
 * Recently opened articles, persisted as `prakaram-recent`. Loaded through the shared validators
 * (`stringList`), never by reading localStorage by hand.
 */
export const useRecentStore = create<RecentState>()(
  persist(
    (set) => ({
      ids: [],
      record: (id) => set((s) => ({ ids: recordRecent(s.ids, id) })),
      clear: () => set({ ids: [] }),
    }),
    {
      name: 'prakaram-recent',
      version: 1,
      partialize: (s) => ({ ids: s.ids }),
      merge: (persisted, current) => ({
        ...current,
        ids: stringList((persisted as { ids?: unknown } | null)?.ids, MAX_RECENT),
      }),
    },
  ),
);
