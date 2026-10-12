import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { boolOr, clampNumber } from './persistence';

export interface LineLeft {
  index: number;
  ms: number;
}

interface MantraState {
  prakaraId: string | null;
  activeChunkIndex: number;
  positions: Record<string, number>;
  zenMode: boolean;
  holding: boolean;
  away: boolean;
  lineLeft: LineLeft | null;
  setLineLeft: (lineLeft: LineLeft | null) => void;
  setHolding: (holding: boolean) => void;
  setAway: (away: boolean) => void;
  openPrakara: (id: string) => void;
  setActiveChunkIndex: (index: number) => void;
  nextChunk: (count: number) => void;
  prevChunk: () => void;
  toggleZenMode: () => void;
}

const MAX_INDEX = Number.MAX_SAFE_INTEGER;

const at = (s: Pick<MantraState, 'prakaraId' | 'positions'>, index: number) => ({
  activeChunkIndex: index,
  positions: s.prakaraId ? { ...s.positions, [s.prakaraId]: index } : s.positions,
});

export const useMantraStore = create<MantraState>()(
  persist(
    (set) => ({
      prakaraId: null,
      activeChunkIndex: 0,
      positions: {},
      zenMode: false,
      holding: false,
      away: false,
      lineLeft: null,
      setLineLeft: (lineLeft) => set({ lineLeft }),
      setHolding: (holding) => set({ holding }),
      setAway: (away) => set({ away }),
      openPrakara: (id) =>
        set((s) => (s.prakaraId === id ? {} : { prakaraId: id, activeChunkIndex: s.positions[id] ?? 0 })),
      setActiveChunkIndex: (index) => set((s) => at(s, clampNumber(index, 0, MAX_INDEX, 0))),
      nextChunk: (count) => set((s) => at(s, (s.activeChunkIndex + 1) % Math.max(1, count))),
      prevChunk: () => set((s) => at(s, Math.max(0, s.activeChunkIndex - 1))),
      toggleZenMode: () => set((s) => ({ zenMode: !s.zenMode })),
    }),
    {
      name: 'parayanam-progress',
      version: 1,
      partialize: ({ prakaraId, positions, zenMode, lineLeft }) => ({ prakaraId, positions, zenMode, lineLeft }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as { prakaraId?: unknown; positions?: unknown; lineLeft?: unknown };
        const raw = p.positions && typeof p.positions === 'object' ? (p.positions as Record<string, unknown>) : {};
        const positions = Object.fromEntries(
          Object.entries(raw).filter(([, v]) => typeof v === 'number' && Number.isInteger(v) && v >= 0),
        ) as Record<string, number>;
        const prakaraId = typeof p.prakaraId === 'string' ? p.prakaraId : null;
        const ll = p.lineLeft as Partial<LineLeft> | null | undefined;
        const lineLeft =
          ll && Number.isInteger(ll.index) && ll.index! >= 0 && typeof ll.ms === 'number' && ll.ms >= 0
            ? { index: ll.index!, ms: ll.ms }
            : null;
        return {
          ...current,
          lineLeft,
          zenMode: boolOr((p as { zenMode?: unknown }).zenMode, current.zenMode),
          prakaraId,
          positions,
          activeChunkIndex: prakaraId ? (positions[prakaraId] ?? 0) : 0,
        };
      },
    },
  ),
);
