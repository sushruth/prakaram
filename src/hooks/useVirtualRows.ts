import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { RefObject } from 'preact';
import { aroundPinned, cumulative, offsetOf, visibleRange, withPinned } from '../services/virtualRows';
import { useScrollOffset } from './useScrollOffset';

/** Pixels of rows mounted above and below the viewport, so a scroll has content ready. */
const DEFAULT_BUFFER = 240;
/** Rows kept mounted on either side of `pinned`; two matches the minimap, which measures at index ± 2. */
const DEFAULT_SLACK = 2;

type RowKey = string | number;

export interface VirtualRowsOptions {
  /** Number of rows in the list. */
  count: number;
  /** Fallback height in pixels for a row that has not been measured yet. */
  estimate: number;
  /** Pixels to mount beyond the viewport on each side. Defaults to `DEFAULT_BUFFER`. */
  buffer?: number;
  /** A row that must always stay mounted, e.g. the active line. */
  pinned?: number;
  /** Rows kept on either side of `pinned`. Defaults to `DEFAULT_SLACK`. */
  slack?: number;
  /**
   * Whether `pinned` expands the window to include both (the reader's active line) or jumps to it when it
   * is outside (a deep link). Defaults to `true` (bridge).
   */
  pinBridges?: boolean;
  /** Element mode: the scrolling element, whose own `scrollTop` and `clientHeight` drive the window. */
  containerRef?: RefObject<HTMLElement | null>;
  /** Window mode (no `containerRef`): the element the rows live in; its document offset is the window's origin. */
  listRef?: RefObject<HTMLElement | null>;
  /**
   * Stable per-row identity. When given, the measured-height cache is keyed by it, so a row inserted among
   * the others (a selection's range row) keeps every other row's measurement. Without it the cache is by
   * index and a count change clears it.
   */
  keys?: ReadonlyArray<RowKey>;
}

export interface VirtualRows {
  /** First row to mount, inclusive. */
  start: number;
  /** Last row to mount, inclusive. `end < start` means nothing is mounted. */
  end: number;
  /** Pixel spacer above `start`. */
  top: number;
  /** Pixel spacer below `end`. */
  bottom: number;
  /** A stable ref callback for a row, which measures it and watches it for re-wraps. */
  measure: (index: number) => (el: HTMLElement | null) => void;
  /** Drop the measured cache and re-read the mounted rows (after a font or width change). */
  remeasure: () => void;
}

interface View {
  start: number;
  end: number;
  top: number;
  bottom: number;
}

/**
 * Window a variable-height list. Rows report their height through `measure`; unmeasured rows fall
 * back to `estimate`, and a `ResizeObserver` refreshes a row that re-wraps. Scroll and resize are
 * rAF-throttled. The returned range is referentially stable while its numbers do not change, so a
 * consumer only re-renders when the window actually moves.
 *
 * Two modes. With `containerRef` the element must be the scroller (it has `overflow` and its own
 * `scrollTop`). Without it the hook windows the page: `window.scrollY` and `window.innerHeight` drive
 * the window, and `listRef` (the element the rows live in) supplies the origin, so a list below the
 * page's chrome still windows correctly. Resize and scroll both recompute the origin, which keeps the
 * window honest when content above the list changes height.
 */
export function useVirtualRows({
  count,
  estimate,
  buffer = DEFAULT_BUFFER,
  pinned,
  slack = DEFAULT_SLACK,
  containerRef,
  listRef,
  keys,
  pinBridges = true,
}: VirtualRowsOptions): VirtualRows {
  const heights = useRef(new Map<RowKey, number>());
  const els = useRef(new Map<number, HTMLElement>());
  const keyOfEl = useRef(new WeakMap<Element, RowKey>());
  const callbacks = useRef(new Map<number, (el: HTMLElement | null) => void>());
  const observer = useRef<ResizeObserver | null>(null);
  const [version, setVersion] = useState(0);
  const scroll = useScrollOffset(containerRef, listRef);

  const keyAt = useCallback((index: number): RowKey => (keys ? keys[index] : index), [keys]);

  const readKey = useCallback((key: RowKey, el: HTMLElement): boolean => {
    const height = el.offsetHeight;
    if (height <= 0 || heights.current.get(key) === height) return false;
    heights.current.set(key, height);
    return true;
  }, []);

  const read = useCallback((index: number, el: HTMLElement) => readKey(keyAt(index), el), [keyAt, readKey]);

  const handleResize = useCallback(
    (entries: ResizeObserverEntry[]) => {
      let changed = false;
      for (const entry of entries) {
        const key = keyOfEl.current.get(entry.target);
        if (key !== undefined && readKey(key, entry.target as HTMLElement)) changed = true;
      }
      if (changed) setVersion((v) => v + 1);
    },
    [readKey],
  );

  const attach = useCallback(
    (index: number, el: HTMLElement | null) => {
      const previous = els.current.get(index);
      if (previous && previous !== el) {
        observer.current?.unobserve(previous);
        keyOfEl.current.delete(previous);
      }
      if (!el) {
        els.current.delete(index);
        return;
      }
      els.current.set(index, el);
      keyOfEl.current.set(el, keyAt(index));
      const ro = observer.current ?? (observer.current = new ResizeObserver(handleResize));
      ro.observe(el);
      if (read(index, el)) setVersion((v) => v + 1);
    },
    [read, keyAt, handleResize],
  );

  // The callback is cached per index and stable; it reads the latest `attach` through a ref, so a key change
  // does not leave a stale closure behind.
  const attachRef = useRef(attach);
  attachRef.current = attach;
  const measure = useCallback((index: number) => {
    let callback = callbacks.current.get(index);
    if (!callback) {
      callback = (el) => attachRef.current(index, el);
      callbacks.current.set(index, callback);
    }
    return callback;
  }, []);

  const reset = useCallback(() => {
    heights.current.clear();
    els.current.forEach((el, index) => read(index, el));
    setVersion((v) => v + 1);
  }, [read]);

  // A new estimate (a font change) invalidates every cached height. Without stable keys a new list does too;
  // with keys, an inserted row keeps every other row's measurement.
  const prevEstimate = useRef(estimate);
  useEffect(() => {
    const fontChanged = prevEstimate.current !== estimate;
    prevEstimate.current = estimate;
    if (keys && !fontChanged) return;
    reset();
  }, [count, estimate, keys, reset]);

  useEffect(() => () => observer.current?.disconnect(), []);

  const cum = useMemo(() => cumulative(count, (i) => heights.current.get(keyAt(i)), estimate), [count, estimate, version, keyAt]);

  const view = useMemo<View>(() => {
    const raw = visibleRange(cum, scroll.top, scroll.viewport, buffer);
    const range = pinned === undefined ? raw : pinBridges ? withPinned(raw, pinned, slack, count) : aroundPinned(raw, pinned, slack, count);
    return { start: range.start, end: range.end, top: offsetOf(cum, range.start), bottom: cum[count] - offsetOf(cum, range.end + 1) };
  }, [cum, count, scroll.top, scroll.viewport, buffer, pinned, slack, pinBridges]);

  const result = useRef<VirtualRows | null>(null);
  let out = result.current;
  if (!out || out.start !== view.start || out.end !== view.end || out.top !== view.top || out.bottom !== view.bottom) {
    out = { ...view, measure, remeasure: reset };
    result.current = out;
  }
  return out;
}
