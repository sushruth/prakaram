import { create } from 'zustand';

export type AppTheme = 'system' | 'light' | 'dark';

const THEME_IDS: AppTheme[] = ['system', 'light', 'dark'];

// 'system' removes the attribute so the OS preference decides in CSS.
export function applyThemeAttribute(theme: AppTheme) {
  if (theme === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', theme);
}

interface ThemeState {
  theme: AppTheme;
  zenMode: boolean;
  setTheme: (theme: AppTheme) => void;
  toggleZenMode: () => void;
}

const SAVED = localStorage.getItem('parayanam_theme') as AppTheme | null;
// Older saved choices (e.g. 'sandhya') fall back to 'system'.
const SAVED_THEME: AppTheme = SAVED && THEME_IDS.includes(SAVED) ? SAVED : 'system';

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
