import { create } from 'zustand';

interface MantraState {
  activeChunkIndex: number;
  zenMode: boolean;
  setActiveChunkIndex: (index: number) => void;
  nextChunk: (count: number) => void;
  prevChunk: () => void;
  toggleZenMode: () => void;
}

export const useMantraStore = create<MantraState>((set) => ({
  activeChunkIndex: 0,
  zenMode: false,
  setActiveChunkIndex: (index) => set({ activeChunkIndex: Math.max(0, index) }),
  nextChunk: (count) => set((s) => ({ activeChunkIndex: (s.activeChunkIndex + 1) % Math.max(1, count) })),
  prevChunk: () => set((s) => ({ activeChunkIndex: Math.max(0, s.activeChunkIndex - 1) })),
  toggleZenMode: () => set((s) => ({ zenMode: !s.zenMode })),
}));
