import { useEffect, useState } from 'preact/hooks';
import { useMantraStore } from '../stores/useMantraStore';
import { Icon } from './Icon';

export function LocateLine() {
  const activeChunkIndex = useMantraStore((s) => s.activeChunkIndex);
  const [side, setSide] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    const check = () => {
      const row = document.querySelector<HTMLElement>('.chunk-row.active');
      if (!row) return setSide(null);
      const { top, bottom } = row.getBoundingClientRect();
      setSide(bottom < 0 ? 'up' : top > window.innerHeight ? 'down' : null);
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [activeChunkIndex]);

  const locate = () =>
    document.querySelector<HTMLElement>('.chunk-row.active')?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return (
    <button
      className="locate-line"
      data-visible={side !== null}
      onClick={locate}
      aria-label="Back to the highlighted line"
      title="Back to the highlighted line"
      tabIndex={side ? 0 : -1}
    >
      <Icon name={side === 'down' ? 'arrow-down' : 'arrow-up'} size={24} />
    </button>
  );
}
