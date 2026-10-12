import { useCadenceStore } from '../stores/useCadenceStore';
import { useMantraStore } from '../stores/useMantraStore';
import { usePrakaraStore } from '../stores/usePrakaraStore';
import { useRoomStore } from '../stores/useRoomStore';
import { useSettingsStore } from '../stores/useSettingsStore';

// Times each line while Learn is active and sends its active time to the learner.
// A deliberate pause (the ring) and away time are excluded. Holds are included: a hold is a relearn signal.
let accumMs = 0;
let since: number | null = null;
let started = false;

const isGuest = () => {
  const r = useRoomStore.getState();
  return r.isInRoom && !r.isHost;
};
const learnPhase = () => {
  const p = useCadenceStore.getState().phase;
  return p === 'measuring' || p === 'engaged';
};
const stopped = () =>
  useCadenceStore.getState().paused || (useSettingsStore.getState().pauseWhenAway && useMantraStore.getState().away);

function stopClock() {
  if (since !== null) {
    accumMs += Date.now() - since;
    since = null;
  }
}

// Runs the clock only while Learn is active, this client is not a guest, and nothing excludes the time.
function syncClock() {
  if (learnPhase() && !isGuest() && !stopped()) {
    if (since === null) since = Date.now();
  } else {
    stopClock();
  }
}

function onLineChange(prev: number, next: number) {
  const active = learnPhase() && !isGuest();
  if (started && active && next === prev + 1) {
    const line = usePrakaraStore.getState().getFlattenedChunks()[prev];
    const ms = accumMs + (since !== null ? Date.now() - since : 0);
    if (line) useCadenceStore.getState().learnLine(line.id, line.sanskrit, ms);
  }
  // A jump, or a first line, starts a new clock; it is not a reading of the line left.
  started = active;
  accumMs = 0;
  since = null;
  syncClock();
}

function onPhase() {
  if (!learnPhase()) {
    started = false;
    accumMs = 0;
  }
  syncClock();
}

export function initLineClock(): () => void {
  const unsubs = [
    useMantraStore.subscribe((s, prev) => {
      if (s.prakaraId !== prev.prakaraId) {
        started = false;
        accumMs = 0;
        since = null;
        syncClock();
      } else if (s.activeChunkIndex !== prev.activeChunkIndex) {
        onLineChange(prev.activeChunkIndex, s.activeChunkIndex);
      } else if (s.away !== prev.away) {
        syncClock();
      }
    }),
    useCadenceStore.subscribe((s, prev) => {
      if (s.phase !== prev.phase) onPhase();
      else if (s.paused !== prev.paused) syncClock();
    }),
    useSettingsStore.subscribe((s, prev) => {
      if (s.pauseWhenAway !== prev.pauseWhenAway) syncClock();
    }),
    useRoomStore.subscribe(() => syncClock()),
  ];
  return () => unsubs.forEach((u) => u());
}
