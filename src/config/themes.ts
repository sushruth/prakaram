export interface ThemeDefinition {
  id: 'system' | 'light' | 'dark';
  label: string;
  attribute: 'light' | 'dark' | null;
}

export const THEMES: readonly ThemeDefinition[] = [
  { id: 'system', label: 'System', attribute: null },
  { id: 'light', label: 'Light', attribute: 'light' },
  { id: 'dark', label: 'Dark', attribute: 'dark' },
];

export type AppTheme = ThemeDefinition['id'];
