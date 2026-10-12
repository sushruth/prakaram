import { create } from 'zustand';

export type AppTheme = 'sandhya' | 'dark' | 'light';

interface ThemeState {
  theme: AppTheme;
  zenMode: boolean;
  setTheme: (theme: AppTheme) => void;
  toggleZenMode: () => void;
}

const SAVED_THEME = (localStorage.getItem('parayanam_theme') as AppTheme) || 'sandhya';

export const useThemeStore = create<ThemeState>((set) => ({
  theme: SAVED_THEME,
  zenMode: false,

  setTheme: (theme) => {
    localStorage.setItem('parayanam_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  toggleZenMode: () => set((s) => ({ zenMode: !s.zenMode })),
}));
