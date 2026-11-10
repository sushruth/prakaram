import { useMantraStore } from '../stores/useMantraStore';
import { useGuest } from '../hooks/useGuest';
import { advanceChunk } from '../services/advance';
import type { MantraChunk } from '../types/mantra';
import { Icon } from './Icon';

/** Previous and next pada. The only way to move the highlight by hand besides the keyboard; the pages follow it. */
export function PageNav({ chunks }: { chunks: MantraChunk[] }) {
  const prevChunk = useMantraStore((s) => s.prevChunk);
  const guest = useGuest();
  if (guest) return null;
  return (
    <nav className="page-nav" aria-label="Move the highlight">
      <button className="btn-icon page-nav-btn" onClick={prevChunk} aria-label="Previous pada" title="Previous pada (←)">
        <Icon name="caret-left" size={22} />
      </button>
      <button className="btn-icon page-nav-btn" onClick={() => advanceChunk(chunks)} aria-label="Next pada" title="Next pada (→ or Space)">
        <Icon name="caret-right" size={22} />
      </button>
    </nav>
  );
}
