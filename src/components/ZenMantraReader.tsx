import { useEffect, useRef } from 'preact/hooks';
import { useMantraStore } from '../stores/useMantraStore';
import { isAutoRunning, isLearning, useCadenceStore } from '../stores/useCadenceStore';
import { usePrakaraStore } from '../stores/usePrakaraStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useRoomStore } from '../stores/useRoomStore';
import { transliterateVedic } from '../services/transliteration';
import { hasSwara } from '../services/swara';
import { sourcePieces } from '../services/swaraSegments';
import { lineMs } from '../services/cadenceEngine';
import { useChunks } from '../hooks/useChunks';
import { useFrozen } from '../hooks/useFrozen';

// A press this long on the highlighted line pauses; a shorter one is a tap.
const HOLD_MS = 250;
import { advanceChunk } from '../services/advance';
import { chantingRoom } from '../services/webrtcRoom';

export function ZenMantraReader() {
  const script = useSettingsStore((s) => s.script);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const wrapLines = useSettingsStore((s) => s.wrapLines);

  const toggleZenMode = useMantraStore((s) => s.toggleZenMode);
  const activeChunkIndex = useMantraStore((s) => s.activeChunkIndex);
  const setActiveChunkIndex = useMantraStore((s) => s.setActiveChunkIndex);
  const openPrakara = useMantraStore((s) => s.openPrakara);
  const prevChunk = useMantraStore((s) => s.prevChunk);
  const nextChunk = useMantraStore((s) => s.nextChunk);

  const phase = useCadenceStore((s) => s.phase);
  const autoRunning = useCadenceStore(isAutoRunning);
  const frozen = useFrozen();
  const frozenRef = useRef(frozen);
  frozenRef.current = frozen;
  const setHolding = useMantraStore((s) => s.setHolding);
  const holdTimer = useRef<number | undefined>(undefined);
  const held = useRef(false);
  const suppressClick = useRef(false);
  const leftover = useRef<{ index: number; ms: number } | null>(null);
  const resetLearning = useCadenceStore((s) => s.resetLearning);
  const msPerMatra = useCadenceStore((s) => s.msPerMatra);

  const getActivePrakara = usePrakaraStore((s) => s.getActivePrakara);
  const isHost = useRoomStore((s) => s.isHost);
  const isInRoom = useRoomStore((s) => s.isInRoom);

  const activeChunkRef = useRef<HTMLDivElement | null>(null);
  const activePrakara = getActivePrakara();
  const chunks = useChunks();

  useEffect(() => {
    openPrakara(activePrakara.id);
  }, [activePrakara.id, openPrakara]);

  useEffect(() => {
    if (chunks.length > 0 && activeChunkIndex >= chunks.length) setActiveChunkIndex(0);
  }, [chunks.length, activeChunkIndex, setActiveChunkIndex]);

  useEffect(() => {
    activeChunkRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeChunkIndex]);

  useEffect(() => {
    if (isInRoom && isHost) {
      chantingRoom.broadcastChunkChange(activeChunkIndex, msPerMatra, autoRunning, activePrakara.id);
    }
  }, [activeChunkIndex, msPerMatra, autoRunning, isInRoom, isHost, activePrakara.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        advanceChunk(chunks);
      } else if (e.code === 'ArrowDown' || e.code === 'ArrowRight') {
        e.preventDefault();
        nextChunk(chunks.length);
      } else if (e.code === 'ArrowUp' || e.code === 'ArrowLeft') {
        e.preventDefault();
        prevChunk();
      } else if (e.code === 'KeyZ') {
        e.preventDefault();
        toggleZenMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chunks, nextChunk, prevChunk, toggleZenMode]);

  useEffect(() => {
    if (!autoRunning || frozen) return;
    const current = chunks[activeChunkIndex];
    if (!current) return;

    const left = leftover.current?.index === activeChunkIndex ? leftover.current.ms : lineMs(current.sanskrit, msPerMatra);
    leftover.current = null;
    const started = Date.now();
    const timer = setTimeout(() => nextChunk(chunks.length), left);
    return () => {
      clearTimeout(timer);
      if (frozenRef.current) leftover.current = { index: activeChunkIndex, ms: Math.max(0, left - (Date.now() - started)) };
    };
  }, [autoRunning, frozen, activeChunkIndex, msPerMatra, chunks, nextChunk]);

  const learning = isLearning(phase);
  const handleChunkClick = (index: number) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    const isNextLine = index === activeChunkIndex + 1;
    if (index === activeChunkIndex || (learning && isNextLine)) {
      advanceChunk(chunks);
      return;
    }
    if (learning) resetLearning();
    setActiveChunkIndex(index);
  };

  const kindLabel = (kind: string) => (kind === 'shloka' ? 'Shloka' : 'Vakya');
  const lineClass = (chunk: { kind?: string; sanskrit: string }) => {
    if (chunk.kind === 'shloka') return 'line-shloka';
    if (chunk.kind === 'vakya') return 'line-vakya';
    return 'line-mantra';
  };

  const renderText = (sanskrit: string) => {
    if (!hasSwara(sanskrit)) return transliterateVedic(sanskrit, script);
    return sourcePieces(sanskrit).map((piece, i) =>
      piece.tone ? (
        <span key={i} className={`swara-${piece.tone}`}>
          {transliterateVedic(piece.text, script)}
        </span>
      ) : (
        transliterateVedic(piece.text, script)
      ),
    );
  };

  return (
    <div className="main-content">
      <div className="chunks-container">
        {chunks.map((chunk, idx) => {
          const isActive = idx === activeChunkIndex;
          return (
            <div
              key={`${chunk.id}-${idx}`}
              ref={isActive ? activeChunkRef : null}
              className={`chunk-row ${isActive ? 'active' : ''} ${Math.abs(idx - activeChunkIndex) === 1 ? 'is-near' : ''}`}
              onClick={() => handleChunkClick(idx)}
              onPointerDown={() => {
                if (!isActive) return;
                suppressClick.current = false;
                holdTimer.current = window.setTimeout(() => {
                  held.current = true;
                  suppressClick.current = true;
                  setHolding(true);
                }, HOLD_MS);
              }}
              onPointerUp={() => {
                window.clearTimeout(holdTimer.current);
                if (held.current) {
                  held.current = false;
                  setHolding(false);
                }
              }}
              onPointerLeave={() => {
                window.clearTimeout(holdTimer.current);
                if (held.current) {
                  held.current = false;
                  setHolding(false);
                }
              }}
            >
              {chunk.isLead !== false && chunk.kind && chunk.kind !== 'mantra' && (
                <span className="kind-label">{kindLabel(chunk.kind)}</span>
              )}
              <div
                className={`vedic-text ${lineClass(chunk)}`}
                style={{
                  fontSize: `${fontSize}px`,
                  whiteSpace: wrapLines ? 'normal' : 'nowrap',
                  overflowX: wrapLines ? 'visible' : 'auto',
                }}
              >
                {renderText(chunk.sanskrit)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
