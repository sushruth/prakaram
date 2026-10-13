import { AppTheme, THEMES } from '../config/themes';

export function applyTheme(theme: AppTheme) {
  const attribute = THEMES.find((t) => t.id === theme)?.attribute ?? null;
  const root = document.documentElement;
  if (attribute) root.setAttribute('data-theme', attribute);
  else root.removeAttribute('data-theme');
  syncThemeColor();
}

/** Keep the browser/status-bar colour equal to the page background, for every theme and for the installed app. */
export function syncThemeColor() {
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-base').trim();
  if (bg) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
}

// The System theme follows the OS, which can change while the app is open.
if (typeof matchMedia === 'function') matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncThemeColor);
