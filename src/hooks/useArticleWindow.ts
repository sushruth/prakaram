import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { RefObject } from 'preact';
import { lineDomId, sectionDomId } from '../services/wikiNav';
import type { Pos } from '../services/nirdesa';
import type { WikiRow } from '../services/wikiRows';
import { useVirtualRows } from './useVirtualRows';

/** `.wiki-line`'s own vertical padding in px (0.85rem at a 16px root), on top of its line-height. */
const LINE_LEAD = 14;

export interface ArticleWindow {
  /** The element the rows live in; the hook reads its document offset as the window origin. */
  listRef: RefObject<HTMLDivElement>;
  /** First row to mount, inclusive. */
  start: number;
  /** Last row to mount, inclusive. */
  end: number;
  /** Pixel spacer above `start` (zero while printing). */
  top: number;
  /** Pixel spacer below `end` (zero while printing). */
  bottom: number;
  /** A stable ref callback per row index. */
  measure: (index: number) => (el: HTMLElement | null) => void;
  /** True between `beforeprint` and `afterprint`, when every row is mounted and the spacers are zero. */
  printing: boolean;
}

/**
 * Window a wiki article's flat row list on the page scroll. The article's chrome (crumbs, title,
 * sources, info) is not windowed, so the rows' container is the window origin. A deep link jumps the
 * window to its row (`pinBridges: false`), scrolls it into view, then the first scroll releases it to
 * normal windowing. Printing mounts every row so the paper copy is never truncated.
 */
export function useArticleWindow({
  rows,
  fontSize,
  id,
  section,
  from,
}: {
  rows: WikiRow[];
  fontSize: number;
  id: string;
  /** Section to land on, from the address. */
  section?: number;
  /** Pada to land on, when the address names one. */
  from?: Pos;
}): ArticleWindow {
  const listRef = useRef<HTMLDivElement>(null);
  const [printing, setPrinting] = useState(false);
  const [pin, setPin] = useState<{ index: number; domId: string } | undefined>(undefined);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  // Resolve the address to a row and pin it. The range row is inserted only after the picked pada, so the
  // target line (at or before it) keeps its index; reading the current row list here is safe.
  const view = useVirtualRows({
    count: rows.length,
    estimate: Math.round(fontSize * 1.85) + LINE_LEAD,
    listRef,
    keys: useMemo(() => rows.map((row) => row.key), [rows]),
    pinned: pin?.index,
    pinBridges: false,
  });

  useEffect(() => {
    if (section === undefined) {
      setPin(undefined);
      return;
    }
    const all = rowsRef.current;
    const index = from
      ? all.findIndex((r) => r.type === 'line' && r.pos.section === from.section && r.pos.pada === from.pada)
      : all.findIndex((r) => r.type === 'heading' && r.section.number === section);
    setPin(index < 0 ? undefined : { index, domId: from ? lineDomId(from) : sectionDomId(section) });
  }, [id, section, from?.section, from?.pada]);

  // Scroll the pinned row in once it is mounted, then let windowing take over on the first scroll.
  useEffect(() => {
    if (!pin) return;
    const el = document.getElementById(pin.domId);
    el?.scrollIntoView({ block: 'start' });
    el?.focus({ preventScroll: true });
    const release = () => setPin(undefined);
    window.addEventListener('scroll', release, { passive: true, once: true });
    return () => window.removeEventListener('scroll', release);
  }, [pin]);

  // Printing must not truncate: every row mounts and the spacers go to zero between beforeprint and afterprint.
  useEffect(() => {
    const before = () => setPrinting(true);
    const after = () => setPrinting(false);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);

  return {
    listRef,
    start: printing ? 0 : view.start,
    end: printing ? rows.length - 1 : view.end,
    top: printing ? 0 : view.top,
    bottom: printing ? 0 : view.bottom,
    measure: view.measure,
    printing,
  };
}
