import { useEffect, useRef } from 'preact/hooks';
import { useMantraStore } from '../stores/useMantraStore';
import { isLearning, useCadenceStore } from '../stores/useCadenceStore';
import { usePrakaraStore } from '../stores/usePrakaraStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useRoomStore } from '../stores/useRoomStore';
import { transliterateVedic } from '../services/transliteration';
import { hasSwara } from '../services/swara';
import { sourcePieces } from '../services/swaraSegments';
import { lineMs } from '../services/cadenceEngine';
import { useChunks } from '../hooks/useChunks';
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
  const paused = useCadenceStore((s) => s.paused);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
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
      chantingRoom.broadcastChunkChange(activeChunkIndex, msPerMatra, phase === 'engaged', activePrakara.id);
    }
  }, [activeChunkIndex, msPerMatra, phase, isInRoom, isHost, activePrakara.id]);

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
    if (phase !== 'engaged' || paused) return;
    const current = chunks[activeChunkIndex];
    if (!current) return;

    const left = leftover.current?.index === activeChunkIndex ? leftover.current.ms : lineMs(current.sanskrit, msPerMatra);
    leftover.current = null;
    const started = Date.now();
    const timer = setTimeout(() => nextChunk(chunks.length), left);
    return () => {
      clearTimeout(timer);
      if (pausedRef.current) leftover.current = { index: activeChunkIndex, ms: Math.max(0, left - (Date.now() - started)) };
    };
  }, [phase, paused, activeChunkIndex, msPerMatra, chunks, nextChunk]);

  const learning = isLearning(phase);
  const handleChunkClick = (index: number) => {
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
              className={`chunk-row ${isActive ? 'active' : ''} ${learning && idx === activeChunkIndex + 1 ? 'is-next' : ''}`}
              onClick={() => handleChunkClick(idx)}
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
