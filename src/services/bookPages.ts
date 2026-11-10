/**
 * Page geometry of the book view. The text is one multi-column block whose columns are the pages; `.book` scrolls
 * sideways over them. Everything is read from the DOM, so the browser's own column breaking stays the only layout.
 */

const book = () => document.querySelector<HTMLElement>('.book');
const text = (el: HTMLElement) => el.querySelector<HTMLElement>('.book-text');
const activePada = (el: HTMLElement) => el.querySelector<HTMLElement>('.pada.active');

/** The width of one page plus the gap after it, and how many pages show at once. */
function geometry(el: HTMLElement): { step: number; pages: number } | null {
  const t = text(el);
  if (!t) return null;
  const style = getComputedStyle(t);
  const pages = Number(style.columnCount) || 1;
  const gap = parseFloat(style.columnGap) || 0;
  const width = (t.clientWidth - (pages - 1) * gap) / pages;
  return width > 0 ? { step: width + gap, pages } : null;
}

/** The page the highlighted pada starts on, counted from the first page. */
function activePage(el: HTMLElement, step: number): number | null {
  const t = text(el);
  const first = activePada(el)?.getClientRects()[0];
  if (!t || !first) return null;
  return Math.max(0, Math.floor((first.left - t.getBoundingClientRect().left + 1) / step));
}

/** Slide so the highlighted pada's page is the first one showing. */
export function showActivePage(behavior: ScrollBehavior = 'smooth'): void {
  const el = book();
  const g = el && geometry(el);
  const page = el && g && activePage(el, g.step);
  if (!el || !g || page === null) return;
  const left = page * g.step;
  if (Math.abs(el.scrollLeft - left) > 1) el.scrollTo({ left, behavior });
}

/** After a manual swipe, settle on the nearest page edge. */
export function snapToPage(): void {
  const el = book();
  const g = el && geometry(el);
  if (!el || !g) return;
  const left = Math.round(el.scrollLeft / g.step) * g.step;
  if (Math.abs(el.scrollLeft - left) > 1) el.scrollTo({ left, behavior: 'smooth' });
}

/** Where the highlighted pada is relative to the pages showing: before them, after them, or on one of them. */
export function activeSide(): 'before' | 'after' | null {
  const el = book();
  const g = el && geometry(el);
  const page = el && g && activePage(el, g.step);
  if (!el || !g || page === null) return null;
  const first = Math.round(el.scrollLeft / g.step);
  return page < first ? 'before' : page >= first + g.pages ? 'after' : null;
}
