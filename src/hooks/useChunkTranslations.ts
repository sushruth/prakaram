import { useEffect, useRef, useState } from 'preact/hooks';
import type { MantraChunk } from '../types/mantra';
import { translateLine } from '../services/translation/cache';

/** How far outside the viewport a row starts translating, so its line is ready before it is read. */
const ROOT_MARGIN = '240px 0px';

/**
 * On-the-wire translations for the player's rows, keyed by row index. One IntersectionObserver watches
 * the rows and fetches only those in or near view, so a long prakaram translates as it is read rather
 * than all at once. A chunk's bundled translation is used as it is; a line the wire cannot translate
 * resolves to '' and shows nothing.
 */
export function useChunkTranslations(chunks: MantraChunk[], enabled: boolean) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [translations, setTranslations] = useState<Record<number, string>>({});

  useEffect(() => {
    setTranslations({});
    if (!enabled) return;
    const root = containerRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    const rows = root.querySelectorAll<HTMLElement>('[data-translation-row]');
    const resolve = (index: number, value: string) => setTranslations((t) => ({ ...t, [index]: value }));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          const index = Number((entry.target as HTMLElement).dataset.translationRow);
          if (!Number.isInteger(index)) continue;
          const chunk = chunks[index];
          if (!chunk || chunk.translation) continue;
          void translateLine(chunk.sanskrit).then((text) => resolve(index, text ?? ''));
        }
      },
      { rootMargin: ROOT_MARGIN },
    );
    rows.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, [enabled, chunks]);

  return { containerRef, translations };
}
