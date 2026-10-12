import { useEffect, useMemo, useRef } from 'preact/hooks';
import { useMantraStore } from '../stores/useMantraStore';
import { useCadenceStore } from '../stores/useCadenceStore';
import { usePrakaraStore } from '../stores/usePrakaraStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useRoomStore } from '../stores/useRoomStore';
import { transliterateVedic } from '../services/transliteration';
import { chunkMatras } from '../services/cadenceEngine';
import { advanceChunk } from '../services/advance';
import { chantingRoom } from '../services/webrtcRoom';
import { Icon } from './Icon';

export function ZenMantraReader() {
  const script = useSettingsStore((s) => s.script);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const wrapLines = useSettingsStore((s) => s.wrapLines);
  const splitLines = useSettingsStore((s) => s.splitLines);

  const activeChunkIndex = useMantraStore((s) => s.activeChunkIndex);
  const setActiveChunkIndex = useMantraStore((s) => s.setActiveChunkIndex);
  const prevChunk = useMantraStore((s) => s.prevChunk);
  const nextChunk = useMantraStore((s) => s.nextChunk);
  const zenMode = useMantraStore((s) => s.zenMode);
  const toggleZenMode = useMantraStore((s) => s.toggleZenMode);

  const mode = useCadenceStore((s) => s.mode);
  const msPerMatra = useCadenceStore((s) => s.msPerMatra);

  const prakaras = usePrakaraStore((s) => s.prakaras);
  const activePrakaraId = usePrakaraStore((s) => s.activePrakaraId);
  const getActivePrakara = usePrakaraStore((s) => s.getActivePrakara);
  const isHost = useRoomStore((s) => s.isHost);
  const isInRoom = useRoomStore((s) => s.isInRoom);

  const activeChunkRef = useRef<HTMLDivElement | null>(null);
  const activePrakara = getActivePrakara();
  const chunks = useMemo(
    () => usePrakaraStore.getState().getFlattenedChunks(),
    [prakaras, activePrakaraId, splitLines],
  );

  useEffect(() => {
    activeChunkRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeChunkIndex]);

  useEffect(() => {
    if (isInRoom && isHost) {
      chantingRoom.broadcastChunkChange(activeChunkIndex, msPerMatra, mode === 'auto', activePrakara.id);
    }
  }, [activeChunkIndex, msPerMatra, mode, isInRoom, isHost, activePrakara.id]);

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
    if (mode !== 'auto') return;
    const current = chunks[activeChunkIndex];
    if (!current) return;

    const timer = setTimeout(() => nextChunk(chunks.length), chunkMatras(current.sanskrit) * msPerMatra);
    return () => clearTimeout(timer);
  }, [mode, activeChunkIndex, msPerMatra, chunks, nextChunk]);

  const handleChunkClick = (index: number) => {
    if (index === activeChunkIndex) advanceChunk(chunks);
    else setActiveChunkIndex(index);
  };

  return (
    <div className={`main-content ${zenMode ? 'zen-active' : ''}`}>
      {zenMode && (
        <button className="btn-primary zen-exit-hint" onClick={toggleZenMode} title="Exit Zen Mode">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Icon name="x" size={14} />
            Exit Zen Mode
          </span>
        </button>
      )}

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 className="title-display" style={{ fontSize: '1.4rem', color: 'var(--accent)', marginBottom: '0.4rem' }}>
          {transliterateVedic(activePrakara.title, script)}
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{activePrakara.description}</p>
      </div>

      <div className="chunks-container">
        {chunks.map((chunk, idx) => {
          const isActive = idx === activeChunkIndex;
          return (
            <div
              key={`${chunk.id}-${idx}`}
              ref={isActive ? activeChunkRef : null}
              className={`chunk-row ${isActive ? 'active' : ''}`}
              onClick={() => handleChunkClick(idx)}
            >
              {chunk.isInstruction && <span className="instruction-badge">Vakya / Procedure</span>}
              <div
                className="vedic-text"
                style={{
                  fontSize: `${fontSize}px`,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                  whiteSpace: wrapLines ? 'normal' : 'nowrap',
                  overflowX: wrapLines ? 'visible' : 'auto',
                }}
              >
                {transliterateVedic(chunk.sanskrit, script)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
