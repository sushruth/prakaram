import { useEffect, useState } from 'preact/hooks';
import type { RefObject } from 'preact';

/** The list-relative scroll offset and viewport height the window is computed from. */
export interface ScrollOffset {
  /** Scroll offset of the list's top edge (element `scrollTop`, or page scroll minus the list's origin). */
  top: number;
  /** Visible height (element `clientHeight`, or `window.innerHeight`). */
  viewport: number;
}

/**
 * Track the list-relative scroll offset, rAF-throttled and passive. With `containerRef` the element is the
 * scroller and its own `scrollTop`/`clientHeight` are read. Without it the page scrolls: `window.scrollY`
 * minus the list's document offset is the offset, and the origin is re-read on every sync (and resize), so
 * content that changes height above the list keeps the window honest.
 */
export function useScrollOffset(
  containerRef?: RefObject<HTMLElement | null>,
  listRef?: RefObject<HTMLElement | null>,
): ScrollOffset {
  const [scroll, setScroll] = useState<ScrollOffset>({ top: 0, viewport: 0 });
  useEffect(() => {
    const el = containerRef?.current;
    if (containerRef && !el) return;
    let raf = 0;
    const sync = () => {
      raf = 0;
      let top: number;
      let viewport: number;
      if (containerRef) {
        top = el!.scrollTop;
        viewport = el!.clientHeight;
      } else {
        const list = listRef?.current;
        top = window.scrollY - (list ? list.getBoundingClientRect().top + window.scrollY : 0);
        viewport = window.innerHeight;
      }
      setScroll((prev) => (prev.top === top && prev.viewport === viewport ? prev : { top, viewport }));
    };
    const schedule = () => {
      if (raf === 0) raf = requestAnimationFrame(sync);
    };
    const target: EventTarget = containerRef ? el! : window;
    target.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    sync();
    return () => {
      target.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [containerRef, listRef]);
  return scroll;
}
