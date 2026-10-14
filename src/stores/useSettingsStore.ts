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
  wrapLines: boolean;
  splitLines: boolean;
  showTranslation: boolean;
  pauseWhenAway: boolean;
  printedNasals: boolean;
  setTheme: (theme: AppTheme) => void;
  setScript: (script: TargetScript) => void;
  setFontSize: (size: number) => void;
  toggleWrapLines: () => void;
  toggleSplitLines: () => void;
  toggleShowTranslation: () => void;
  togglePauseWhenAway: () => void;
  togglePrintedNasals: () => void;
}

const THEME_IDS = THEMES.map((t) => t.id);
const SCRIPT_IDS = SCRIPTS.map((s) => s.id) as TargetScript[];

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      script: 'devanagari',
      fontSize: FONT_SIZE.fallback,
      wrapLines: true,
      splitLines: false,
      showTranslation: false,
      pauseWhenAway: true,
      printedNasals: true,
      setTheme: (theme) => set({ theme }),
      setScript: (script) => set({ script }),
      setFontSize: (size) => set({ fontSize: clampNumber(size, FONT_SIZE.min, FONT_SIZE.max, FONT_SIZE.fallback) }),
      toggleWrapLines: () => set((s) => ({ wrapLines: !s.wrapLines })),
      toggleSplitLines: () => set((s) => ({ splitLines: !s.splitLines })),
      toggleShowTranslation: () => set((s) => ({ showTranslation: !s.showTranslation })),
      togglePauseWhenAway: () => set((s) => ({ pauseWhenAway: !s.pauseWhenAway })),
      togglePrintedNasals: () => set((s) => ({ printedNasals: !s.printedNasals })),
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
          wrapLines: boolOr(p.wrapLines, current.wrapLines),
          splitLines: boolOr(p.splitLines, current.splitLines),
          showTranslation: boolOr(p.showTranslation, current.showTranslation),
          pauseWhenAway: boolOr(p.pauseWhenAway, current.pauseWhenAway),
          printedNasals: boolOr(p.printedNasals, current.printedNasals),
        };
      },
    },
  ),
);

applyTheme(useSettingsStore.getState().theme);
useSettingsStore.subscribe((s, prev) => {
  if (s.theme !== prev.theme) applyTheme(s.theme);
});
