import { create } from 'zustand';
import { TargetScript } from '../types/mantra';

interface MantraStoreState {
  targetScript: TargetScript;
  fontSize: number;
  activeChunkIndex: number;
  wrapLines: boolean;
  splitLines: boolean;

  toggleWrapLines: () => void;
  toggleSplitLines: () => void;
  setScript: (script: TargetScript) => void;
  setFontSize: (size: number) => void;
  setActiveChunkIndex: (index: number) => void;
  nextChunk: (maxCount: number) => void;
  prevChunk: () => void;
}

const SAVED_SCRIPT = (localStorage.getItem('parayanam_script') as TargetScript) || 'devanagari';
const SAVED_WRAP = localStorage.getItem('parayanam_wrap') !== 'false';
const SAVED_SPLIT = localStorage.getItem('parayanam_split') === 'true';

export const useMantraStore = create<MantraStoreState>((set) => ({
  targetScript: SAVED_SCRIPT,
  fontSize: 26,
  activeChunkIndex: 0,
  wrapLines: SAVED_WRAP,
  splitLines: SAVED_SPLIT,

  toggleWrapLines: () => {
    set((s) => {
      localStorage.setItem('parayanam_wrap', String(!s.wrapLines));
      return { wrapLines: !s.wrapLines };
    });
  },

  toggleSplitLines: () => {
    set((s) => {
      localStorage.setItem('parayanam_split', String(!s.splitLines));
      return { splitLines: !s.splitLines };
    });
  },

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
