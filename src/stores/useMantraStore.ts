import { create } from 'zustand';
import { TargetScript } from '../types/mantra';

interface MantraStoreState {
  targetScript: TargetScript;
  fontSize: number;
  activeChunkIndex: number;

  setScript: (script: TargetScript) => void;
  setFontSize: (size: number) => void;
  setActiveChunkIndex: (index: number) => void;
  nextChunk: (maxCount: number) => void;
  prevChunk: () => void;
}

const SAVED_SCRIPT = (localStorage.getItem('parayanam_script') as TargetScript) || 'devanagari';

export const useMantraStore = create<MantraStoreState>((set) => ({
  targetScript: SAVED_SCRIPT,
  fontSize: 26,
  activeChunkIndex: 0,

  setScript: (script) => {
    localStorage.setItem('parayanam_script', script);
    set({ targetScript: script });
  },

  setFontSize: (size) => {
    set({ fontSize: Math.max(16, Math.min(42, size)) });
  },

  setActiveChunkIndex: (index) => {
    set({ activeChunkIndex: Math.max(0, index) });
  },

  nextChunk: (maxCount) => {
    set((s) => ({
      activeChunkIndex: s.activeChunkIndex + 1 < maxCount ? s.activeChunkIndex + 1 : 0,
    }));
  },

  prevChunk: () => {
    set((s) => ({
      activeChunkIndex: Math.max(0, s.activeChunkIndex - 1),
    }));
  },
}));
