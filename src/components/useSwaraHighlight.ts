import { useEffect } from 'preact/hooks';
import type { RefObject } from 'preact';
import type { SwaraRange } from '../services/swaraRanges';
import type { SwaraTone } from '../services/swaraSegments';

/** A Range end: a text node and a UTF-16 offset into it. */
interface Spot {
  node: Text;
  offset: number;
}

/** The shared Highlight for a tone, created once and reused by every line. */
function registryFor(tone: SwaraTone): Highlight | undefined {
  const key = `swara-${tone}`;
  const existing = CSS.highlights.get(key);
  if (existing) return existing;
  const highlight = new Highlight();
  CSS.highlights.set(key, highlight);
  return highlight;
}

/** The (text node, offset) for a character offset into the element's text, walking its text nodes in order. */
function spotAt(root: Node, offset: number): Spot | undefined {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node as Text;
    if (remaining <= text.data.length) return { node: text, offset: remaining };
    remaining -= text.data.length;
  }
  return undefined;
}

/**
 * Colour the swara ranges of the line held by `ref` with the CSS Custom Highlight API. Each range
 * joins the shared `swara-up`/`swara-down`/`swara-double` registry entries; unmount removes this
 * line's ranges so a virtualised line leaves nothing behind. `ranges` must be referentially stable
 * (memoised on the line and script) or the effect thrashes.
 *
 * The API is part of the supported browser set, so there is no fallback: if it is absent, do nothing.
 */
export function useSwaraHighlight(ref: RefObject<HTMLElement>, ranges: SwaraRange[]) {
  useEffect(() => {
    const el = ref.current;
    if (!el || ranges.length === 0) return;
    if (typeof CSS === 'undefined' || !CSS.highlights || typeof Highlight === 'undefined') return;
    const added: [Highlight, Range][] = [];
    for (const { tone, start, end } of ranges) {
      const from = spotAt(el, start);
      const to = spotAt(el, end);
      const highlight = registryFor(tone);
      if (!from || !to || !highlight) continue;
      const range = document.createRange();
      range.setStart(from.node, from.offset);
      range.setEnd(to.node, to.offset);
      highlight.add(range);
      added.push([highlight, range]);
    }
    return () => {
      for (const [highlight, range] of added) highlight.delete(range);
    };
  }, [ref, ranges]);
}
