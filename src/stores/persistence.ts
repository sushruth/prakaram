export function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && (options as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function boolOr(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

/** A list of non-empty strings, trimmed, deduped and capped at `max`. Drops anything else. */
export function stringList(value: unknown, max: number): string[] {
  const out: string[] = [];
  for (const item of Array.isArray(value) ? value : []) {
    const s = typeof item === 'string' ? item.trim() : '';
    if (!s || out.includes(s)) continue;
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}
