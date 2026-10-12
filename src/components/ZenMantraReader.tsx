import { useEffect, useRef } from 'preact/hooks';
import { useMantraStore } from '../stores/useMantraStore';
import { useCadenceStore } from '../stores/useCadenceStore';
import { usePrakaraStore } from '../stores/usePrakaraStore';
import { useThemeStore } from '../stores/useThemeStore';
import { useRoomStore } from '../stores/useRoomStore';
import { transliterateVedic } from '../services/transliteration';
import { calculateChunkWeight } from '../services/syllabifier';
import { chantingRoom } from '../services/webrtcRoom';
import { Icon } from './Icon';

export function ZenMantraReader() {
  const { targetScript, fontSize, activeChunkIndex, setActiveChunkIndex, nextChunk, prevChunk, wrapLines } = useMantraStore();
  const { isAutoProgress, msPerMatra, registerTap } = useCadenceStore();
  const { getFlattenedChunks, getActivePrakara } = usePrakaraStore();
  const { zenMode, toggleZenMode } = useThemeStore();
  const { isHost, isInRoom } = useRoomStore();

  const activeChunkRef = useRef<HTMLDivElement | null>(null);
  const chunks = getFlattenedChunks();
  const activePrakara = getActivePrakara();

  // Scroll active chunk into center
  useEffect(() => {
    if (activeChunkRef.current) {
      activeChunkRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeChunkIndex]);

  // Broadcast chunk change if host in live WebRTC room
  useEffect(() => {
    if (isInRoom && isHost) {
      chantingRoom.broadcastChunkChange(activeChunkIndex, msPerMatra, isAutoProgress, activePrakara.id);
    }
  }, [activeChunkIndex, msPerMatra, isAutoProgress, isInRoom, isHost, activePrakara.id]);

  // Handle user tap / click on chunk to advance
  const handleChunkClick = (index: number) => {
    if (index === activeChunkIndex) {
      // Tap active chunk: record cadence and advance
      const currentChunk = chunks[activeChunkIndex];
      if (currentChunk) {
        registerTap(currentChunk.id, currentChunk.sanskrit);
      }
      nextChunk(chunks.length);
    } else {
      setActiveChunkIndex(index);
    }
  };

  // Keyboard navigation: Spacebar / Arrow keys / Z for Zen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        const currentChunk = chunks[activeChunkIndex];
        if (currentChunk) {
          registerTap(currentChunk.id, currentChunk.sanskrit);
        }
        nextChunk(chunks.length);
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
  }, [activeChunkIndex, chunks, nextChunk, prevChunk, registerTap, toggleZenMode]);

  // Auto-progress timer
  useEffect(() => {
    if (!isAutoProgress) return;

    const currentChunk = chunks[activeChunkIndex];
    if (!currentChunk) return;

    const matraWeight = Math.max(3, calculateChunkWeight(currentChunk.sanskrit));
    const durationMs = matraWeight * msPerMatra;

    const timer = setTimeout(() => {
      nextChunk(chunks.length);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [isAutoProgress, activeChunkIndex, msPerMatra, chunks, nextChunk]);

  return (
    <div className={`main-content ${zenMode ? 'zen-active' : ''}`}>
      {zenMode && (
        <button
          className="btn-primary zen-exit-hint"
          onClick={toggleZenMode}
          title="Exit Zen Mode"
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><Icon name="x" size={14} />Exit Zen Mode</span>
        </button>
      )}

      {/* Prakara Title Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 className="title-display" style={{ fontSize: '1.4rem', color: 'var(--accent)', marginBottom: '0.4rem' }}>
          {transliterateVedic(activePrakara.title, targetScript)}
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          {activePrakara.description}
        </p>
      </div>

      {/* Chunks List */}
      <div className="chunks-container">
        {chunks.map((chunk, idx) => {
          const isActive = idx === activeChunkIndex;
          const transliteratedText = transliterateVedic(chunk.sanskrit, targetScript);

          return (
            <div
              key={chunk.id + '-' + idx}
              ref={isActive ? activeChunkRef : null}
              className={`chunk-row ${isActive ? 'active' : ''}`}
              onClick={() => handleChunkClick(idx)}
            >
              {chunk.isInstruction && (
                <span className="instruction-badge">Vakya / Procedure</span>
              )}

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
                {transliteratedText}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
