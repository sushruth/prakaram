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

/**
 * Keep every pada on one page. Inline text cannot avoid a column break in CSS, so a pada that straddles two pages
 * becomes an atomic inline box (`.keep`), which moves whole to the next page. Fixing one pushes the rest along, so
 * this walks forward in document order and re-measures only after a change.
 */
export function keepPadasWhole(): void {
  const el = book();
  const t = el && text(el);
  const g = el && geometry(el);
  if (!t || !g) return;
  t.querySelectorAll('.pada.keep').forEach((p) => p.classList.remove('keep'));
  const origin = () => t.getBoundingClientRect().left;
  const column = (x: number, left: number) => Math.floor((x - left + 1) / g.step);
  for (const pada of t.querySelectorAll<HTMLElement>('.pada')) {
    const rects = pada.getClientRects();
    if (rects.length < 2) continue;
    const left = origin();
    if (column(rects[0].left, left) !== column(rects[rects.length - 1].left, left)) pada.classList.add('keep');
  }
}

/** The index of the first pada that starts on the page `delta` pages from the highlighted pada's page, if any. */
export function padaOnPage(delta: number): number | null {
  const el = book();
  const t = el && text(el);
  const g = el && geometry(el);
  const page = el && g && activePage(el, g.step);
  if (!t || !g || page === null) return null;
  const left = t.getBoundingClientRect().left;
  const target = Math.max(0, page + delta);
  for (const pada of t.querySelectorAll<HTMLElement>('.pada')) {
    const first = pada.getClientRects()[0];
    if (first && Math.floor((first.left - left + 1) / g.step) === target) return Number(pada.dataset.translationRow);
  }
  return null;
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
