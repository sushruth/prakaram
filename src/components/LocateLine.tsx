import { useEffect, useState } from 'preact/hooks';
import { useMantraStore } from '../stores/useMantraStore';
import { activeSide, showActivePage } from '../services/bookPages';
import { Icon } from './Icon';

/** Shown after a swipe has taken the highlighted pada off the pages in view; slides back to it. */
export function LocateLine() {
  const activeChunkIndex = useMantraStore((s) => s.activeChunkIndex);
  const [side, setSide] = useState<'before' | 'after' | null>(null);

  useEffect(() => {
    const book = document.querySelector('.book');
    const check = () => setSide(activeSide());
    check();
    book?.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      book?.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [activeChunkIndex]);

  return (
    <button
      className="locate-line"
      data-visible={side !== null}
      onClick={() => showActivePage('smooth')}
      aria-label="Back to the highlighted pada"
      title="Back to the highlighted pada"
      tabIndex={side ? 0 : -1}
    >
      <Icon name={side === 'before' ? 'arrow-left' : 'arrow-right'} size={24} />
    </button>
  );
}
