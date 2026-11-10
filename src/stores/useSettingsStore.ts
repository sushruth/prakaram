import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppTheme, THEMES } from '../config/themes';
import { SCRIPTS } from '../services/transliteration';
import { applyTheme } from '../services/theme';
import { TargetScript } from '../types/mantra';
import { boolOr, clampNumber, oneOf } from './persistence';

export const FONT_SIZE = { min: 16, max: 42, fallback: 26 } as const;

export interface SettingsState {
  theme: AppTheme;
  script: TargetScript;
  fontSize: number;
  showTranslation: boolean;
  pauseWhenAway: boolean;
  printedNasals: boolean;
  paceDebug: boolean;
  setTheme: (theme: AppTheme) => void;
  setScript: (script: TargetScript) => void;
  setFontSize: (size: number) => void;
  toggleShowTranslation: () => void;
  togglePauseWhenAway: () => void;
  togglePrintedNasals: () => void;
  togglePaceDebug: () => void;
}

const THEME_IDS = THEMES.map((t) => t.id);
const SCRIPT_IDS = SCRIPTS.map((s) => s.id) as TargetScript[];

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      script: 'kannada',
      fontSize: FONT_SIZE.fallback,
      showTranslation: false,
      pauseWhenAway: false,
      printedNasals: false,
      paceDebug: false,
      setTheme: (theme) => set({ theme }),
      setScript: (script) => set({ script }),
      setFontSize: (size) => set({ fontSize: clampNumber(size, FONT_SIZE.min, FONT_SIZE.max, FONT_SIZE.fallback) }),
      toggleShowTranslation: () => set((s) => ({ showTranslation: !s.showTranslation })),
      togglePauseWhenAway: () => set((s) => ({ pauseWhenAway: !s.pauseWhenAway })),
      togglePrintedNasals: () => set((s) => ({ printedNasals: !s.printedNasals })),
      togglePaceDebug: () => set((s) => ({ paceDebug: !s.paceDebug })),
    }),
    {
      name: 'prakaram-settings',
      version: 1,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SettingsState>;
        return {
          ...current,
          theme: oneOf(p.theme, THEME_IDS, current.theme),
          script: oneOf(p.script, SCRIPT_IDS, current.script),
          fontSize: clampNumber(p.fontSize, FONT_SIZE.min, FONT_SIZE.max, current.fontSize),
          showTranslation: boolOr(p.showTranslation, current.showTranslation),
          pauseWhenAway: boolOr(p.pauseWhenAway, current.pauseWhenAway),
          printedNasals: boolOr(p.printedNasals, current.printedNasals),
          paceDebug: boolOr(p.paceDebug, current.paceDebug),
        };
      },
    },
  ),
);

applyTheme(useSettingsStore.getState().theme);
useSettingsStore.subscribe((s, prev) => {
  if (s.theme !== prev.theme) applyTheme(s.theme);
});
