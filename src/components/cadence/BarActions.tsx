import { useState } from 'preact/hooks';
import { encodePrakaraToUrlHash } from '../../services/urlCodec';
import { usePrakaraStore } from '../../stores/usePrakaraStore';
import { useCadenceStore } from '../../stores/useCadenceStore';
import { Icon } from '../Icon';

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const preferredBpm = Math.round(60000 / useCadenceStore.getState().msPerMatra);
    const shared = { ...usePrakaraStore.getState().getActivePrakara(), preferredBpm };
    const hash = await encodePrakaraToUrlHash(shared);
    const url = `${window.location.origin}${window.location.pathname}#p=${hash}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <button className="icon-btn" onClick={handleShare} title="Copy a link to this prakara and pace" aria-label="Copy link">
      <Icon name={copied ? 'check' : 'link'} size={16} />
    </button>
  );
}

export function ResetButton() {
  const resetLearning = useCadenceStore((s) => s.resetLearning);
  return (
    <button className="icon-btn" onClick={resetLearning} title="Clear recorded taps" aria-label="Clear recorded taps">
      <Icon name="arrow-counter-clockwise" size={16} />
    </button>
  );
}
