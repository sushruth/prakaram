import { useMantraStore } from '../stores/useMantraStore';
import { isLearning, useCadenceStore } from '../stores/useCadenceStore';
import { useGuest } from '../hooks/useGuest';
import { advanceChunk } from '../services/advance';
import { padaOnPage } from '../services/bookPages';
import type { MantraChunk } from '../types/mantra';
import { Icon } from './Icon';
import type { IconName } from '../icons/phosphor';

/**
 * Moves the highlight (the pages follow it): to the start, a page back, a pada back, a pada on, a page on, the end.
 * Only `next` counts as a tap for Learn; a jump resets it, as the old tap-to-jump did.
 */
export function PageNav({ chunks }: { chunks: MantraChunk[] }) {
  const prevChunk = useMantraStore((s) => s.prevChunk);
  const guest = useGuest();
  if (guest) return null;

  const jump = (index: number | null) => {
    if (index === null) return;
    const cadence = useCadenceStore.getState();
    if (isLearning(cadence.phase)) cadence.resetLearning();
    useMantraStore.getState().setActiveChunkIndex(Math.max(0, Math.min(chunks.length - 1, index)));
  };
  const last = chunks.length - 1;
  const buttons: [IconName, string, () => void][] = [
    ['caret-line-left', 'Start', () => jump(0)],
    ['caret-double-left', 'Previous page', () => jump(padaOnPage(-1))],
    ['caret-left', 'Previous pada (←)', prevChunk],
    ['caret-right', 'Next pada (→ or Space)', () => advanceChunk(chunks)],
    ['caret-double-right', 'Next page', () => jump(padaOnPage(1) ?? last)],
    ['caret-line-right', 'End', () => jump(last)],
  ];
  return (
    <nav className="page-nav" aria-label="Move the highlight">
      {buttons.map(([icon, label, onClick]) => (
        <button key={icon} className="btn-icon page-nav-btn" onClick={onClick} aria-label={label} title={label}>
          <Icon name={icon} size={20} />
        </button>
      ))}
    </nav>
  );
}
