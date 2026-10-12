import { useCadenceStore } from '../stores/useCadenceStore';
import { useMantraStore } from '../stores/useMantraStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useGuest } from './useGuest';

// True while auto-advance is held: by a pause, a press on the line, or the page being away.
export function useFrozen(): boolean {
  const guest = useGuest();
  const paused = useCadenceStore((s) => s.paused);
  const holding = useMantraStore((s) => s.holding);
  const away = useMantraStore((s) => s.away);
  const pauseWhenAway = useSettingsStore((s) => s.pauseWhenAway);
  return !guest && (paused || holding || (pauseWhenAway && away));
}
