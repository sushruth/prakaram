import { AppTheme, THEMES } from '../config/themes';

export function applyTheme(theme: AppTheme) {
  const attribute = THEMES.find((t) => t.id === theme)?.attribute ?? null;
  const root = document.documentElement;
  if (attribute) root.setAttribute('data-theme', attribute);
  else root.removeAttribute('data-theme');
}
