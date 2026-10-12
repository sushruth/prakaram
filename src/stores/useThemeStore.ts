import { create } from 'zustand';
import { THEMES, AppTheme } from '../config/themes';

export type { AppTheme } from '../config/themes';

const THEME_IDS: string[] = THEMES.map((t) => t.id);

export function applyThemeAttribute(theme: AppTheme) {
  const attribute = THEMES.find((t) => t.id === theme)?.attribute ?? null;
  if (attribute === null) document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', attribute);
}

interface ThemeState {
  theme: AppTheme;
  zenMode: boolean;
  setTheme: (theme: AppTheme) => void;
  toggleZenMode: () => void;
}

const SAVED = localStorage.getItem('parayanam_theme');
const SAVED_THEME: AppTheme = SAVED && THEME_IDS.includes(SAVED) ? (SAVED as AppTheme) : 'system';

export const useThemeStore = create<ThemeState>((set) => ({
  theme: SAVED_THEME,
  zenMode: false,

  setTheme: (theme) => {
    localStorage.setItem('parayanam_theme', theme);
    applyThemeAttribute(theme);
    set({ theme });
  },

  toggleZenMode: () => set((s) => ({ zenMode: !s.zenMode })),
}));
