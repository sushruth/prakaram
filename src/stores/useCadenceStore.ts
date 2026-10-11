import { create } from 'zustand';
import { LayaType, LAYA_PRESETS } from '../types/cadence';
import { CadenceLearningEngine } from '../services/cadenceEngine';

interface CadenceState {
  bpm: number;
  laya: LayaType;
  msPerMatra: number;
  confidenceScore: number;
  canAutoProgress: boolean;
  isAutoProgress: boolean;
  historyCount: number;

  engine: CadenceLearningEngine;

  setBpm: (bpm: number, laya?: LayaType) => void;
  setLayaPreset: (laya: LayaType) => void;
  registerTap: (chunkId: string, chunkSanskrit: string) => void;
  toggleAutoProgress: () => void;
  setAutoProgress: (active: boolean) => void;
  resetCadence: () => void;
}

const engineInstance = new CadenceLearningEngine(72);

export const useCadenceStore = create<CadenceState>((set, get) => ({
  bpm: 72,
  laya: 'abhyasa',
  msPerMatra: 833,
  confidenceScore: 0,
  canAutoProgress: false,
  isAutoProgress: false,
  historyCount: 0,
  engine: engineInstance,

  setBpm: (bpm: number, laya: LayaType = 'custom') => {
    get().engine.setBpm(bpm, laya);
    const metrics = get().engine.getMetrics();
    set({
      bpm: metrics.currentBpm,
      laya: metrics.activeLaya,
      msPerMatra: metrics.msPerMatra,
      confidenceScore: metrics.confidenceScore,
      canAutoProgress: metrics.canAutoProgress,
    });
  },

  setLayaPreset: (laya: LayaType) => {
    get().engine.setLayaPreset(laya);
    const metrics = get().engine.getMetrics();
    set({
      bpm: metrics.currentBpm,
      laya: metrics.activeLaya,
      msPerMatra: metrics.msPerMatra,
      confidenceScore: metrics.confidenceScore,
      canAutoProgress: metrics.canAutoProgress,
    });
  },

  registerTap: (chunkId: string, chunkSanskrit: string) => {
    const metrics = get().engine.registerTap(chunkId, chunkSanskrit);
    set({
      bpm: metrics.currentBpm,
      msPerMatra: metrics.msPerMatra,
      confidenceScore: metrics.confidenceScore,
      canAutoProgress: metrics.canAutoProgress,
      laya: metrics.activeLaya,
      historyCount: metrics.historyLength,
    });
  },

  toggleAutoProgress: () => {
    set((s) => ({ isAutoProgress: !s.isAutoProgress }));
  },

  setAutoProgress: (active: boolean) => {
    set({ isAutoProgress: active });
  },

  resetCadence: () => {
    get().engine.resetSession();
    const metrics = get().engine.getMetrics();
    set({
      confidenceScore: 0,
      canAutoProgress: false,
      isAutoProgress: false,
      historyCount: 0,
      bpm: metrics.currentBpm,
      msPerMatra: metrics.msPerMatra,
    });
  },
}));
