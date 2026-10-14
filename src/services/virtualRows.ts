/**
 * Variable-height list math for windowing. A list of `count` rows is described by the prefix sums of
 * their tops (`cumulative`): a row that has been measured uses its real height, an unmeasured one
 * falls back to `estimate`, so a window can be computed before anything is on screen and refined as
 * rows report their height. Pure: no DOM, no Preact, no `window` — see `useVirtualRows` for the hook
 * that feeds it real measurements.
 */

/** A row's measured height, or `undefined` while it is still unmeasured. */
export type HeightLookup = (index: number) => number | undefined;

/** An inclusive index range `[start, end]`. `end < start` means an empty range. */
export interface RowRange {
  start: number;
  end: number;
}

/** A mounted window: the inclusive range plus the pixel spacers that keep the scroll height stable. */
export interface VisibleRange extends RowRange {
  /** Pixels of spacer above the first mounted row. */
  top: number;
  /** Pixels of spacer below the last mounted row. */
  bottom: number;
  /** The full scroll height: `cum[count]`. */
  total: number;
}

/** Prefix sums of row tops, `count + 1` entries: `cum[i]` is the top of row `i`, `cum[count]` the total. */
export function cumulative(count: number, heightAt: HeightLookup, estimate: number): number[] {
  const cum = new Array<number>(count + 1);
  cum[0] = 0;
  for (let i = 0; i < count; i++) cum[i + 1] = cum[i] + (heightAt(i) ?? estimate);
  return cum;
}

/** The top of row `index`, clamped to the list's ends. */
export function offsetOf(cum: number[], index: number): number {
  const count = cum.length - 1;
  return cum[index < 0 ? 0 : index > count ? count : index];
}

/**
 * The row containing scroll offset `y`, clamped to `[0, count - 1]`. A `y` exactly on a row's top is
 * that row (the later one), so a boundary never lands on the row above.
 */
export function indexAt(cum: number[], y: number): number {
  const count = cum.length - 1;
  if (count <= 0) return 0;
  if (y <= cum[0]) return 0;
  if (y >= cum[count]) return count - 1;
  let lo = 0;
  let hi = count - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (cum[mid] <= y) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/**
 * The inclusive range of rows intersecting `[scrollTop - buffer, scrollTop + viewport + buffer]`, with
 * the spacers that keep the scroll height at `total` and the mounted rows at their real offset. The
 * spacers assume measured heights match what is rendered; unmeasured rows drift by `estimate` until
 * they report in, which is inherent to a variable-height virtual list.
 */
export function visibleRange(cum: number[], scrollTop: number, viewport: number, buffer: number): VisibleRange {
  const count = cum.length - 1;
  const total = cum[count];
  if (count <= 0) return { start: 0, end: -1, top: 0, bottom: 0, total };
  const start = indexAt(cum, scrollTop - buffer);
  const end = indexAt(cum, scrollTop + viewport + buffer);
  return { start, end, top: cum[start], bottom: total - cum[end + 1], total };
}

/**
 * Expand `range` so `pinned` (the active row) is inside with at least `slack` rows on either side.
 * Pass `count` to clamp the upper end to the list; without it the function can only clamp to zero.
 */
export function withPinned(range: RowRange, pinned: number, slack: number, count = Number.POSITIVE_INFINITY): RowRange {
  const p = Math.max(0, pinned);
  const s = Math.max(0, slack);
  const lo = Math.max(0, p - s);
  const hi = Math.min(count - 1, p + s);
  return { start: Math.max(0, Math.min(range.start, lo)), end: Math.max(range.end, hi) };
}

/**
 * Jump to `pinned` when it lies outside `range`: a window of `slack` rows on either side, clamped to the
 * list. When `pinned` is already inside, `range` is returned unchanged. Unlike `withPinned`, nothing is
 * mounted between the two, so landing on a far row (a deep link) never mounts the whole list.
 */
export function aroundPinned(range: RowRange, pinned: number, slack: number, count: number): RowRange {
  if (pinned >= range.start && pinned <= range.end) return range;
  const p = Math.max(0, Math.min(count - 1, pinned));
  const s = Math.max(0, slack);
  return { start: Math.max(0, p - s), end: Math.min(count - 1, p + s) };
}
