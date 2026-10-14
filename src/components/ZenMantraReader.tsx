import { useEffect, useMemo, useRef } from 'preact/hooks';
import { useMantraStore } from '../stores/useMantraStore';
import { isAutoRunning, isLearning, useCadenceStore } from '../stores/useCadenceStore';
import { usePrakaraStore } from '../stores/usePrakaraStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useRoomStore } from '../stores/useRoomStore';
import { lineMs } from '../services/cadenceEngine';
import { useChunks } from '../hooks/useChunks';
import { useFrozen } from '../hooks/useFrozen';
import { useGuest } from '../hooks/useGuest';
import { TRANSLATION_ENABLED } from '../config/features';
import { useChunkTranslations } from '../hooks/useChunkTranslations';

import { advanceChunk } from '../services/advance';
import { lineClass } from '../config/lineClass';
import { Sanskrit } from './Sanskrit';
import { Term } from './Term';
import { SourceList } from './SourceList';
import { SUKTA_MAP } from '../data';
import type { ArticleSource } from '../services/wiki';
import { chantingRoom } from '../services/webrtcRoom';

export function ZenMantraReader() {
  const fontSize = useSettingsStore((s) => s.fontSize);
  const wrapLines = useSettingsStore((s) => s.wrapLines);
  // Off unless the translation experiment is explicitly enabled (src/config/features.ts).
  const showTranslation = TRANSLATION_ENABLED && useSettingsStore((s) => s.showTranslation);

  const toggleZenMode = useMantraStore((s) => s.toggleZenMode);
  const activeChunkIndex = useMantraStore((s) => s.activeChunkIndex);
  const setActiveChunkIndex = useMantraStore((s) => s.setActiveChunkIndex);
  const openPrakara = useMantraStore((s) => s.openPrakara);
  const prevChunk = useMantraStore((s) => s.prevChunk);
  const nextChunk = useMantraStore((s) => s.nextChunk);

  const phase = useCadenceStore((s) => s.phase);
  const autoRunning = useCadenceStore(isAutoRunning);
  const frozen = useFrozen();
  const guest = useGuest();
  const frozenRef = useRef(frozen);
  frozenRef.current = frozen;
  const setHolding = useMantraStore((s) => s.setHolding);
  const pressed = useRef(false);
  const suppressClick = useRef(false);
  const resetLearning = useCadenceStore((s) => s.resetLearning);
  const msPerMatra = useCadenceStore((s) => s.msPerMatra);

  const getActivePrakara = usePrakaraStore((s) => s.getActivePrakara);
  const isHost = useRoomStore((s) => s.isHost);
  const isInRoom = useRoomStore((s) => s.isInRoom);

  const activeChunkRef = useRef<HTMLDivElement | null>(null);
  const activePrakara = getActivePrakara();
  const chunks = useChunks();
  const { containerRef, translations } = useChunkTranslations(chunks, showTranslation);

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
      if (guest) return;
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
  }, [chunks, nextChunk, prevChunk, toggleZenMode, guest]);

  useEffect(() => {
    if (!autoRunning || frozen) return;
    const current = chunks[activeChunkIndex];
    if (!current) return;

    const { lineLeft, setLineLeft } = useMantraStore.getState();
    const left = lineLeft?.index === activeChunkIndex ? lineLeft.ms : lineMs(current.sanskrit, msPerMatra);
    if (lineLeft) setLineLeft(null);
    const started = Date.now();
    const remaining = () => Math.max(0, left - (Date.now() - started));
    const timer = setTimeout(() => nextChunk(chunks.length), left);
    // Closing the page mid-line keeps the rest of the line for the next visit.
    const saveOnHide = () => setLineLeft({ index: activeChunkIndex, ms: remaining() });
    window.addEventListener('pagehide', saveOnHide);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pagehide', saveOnHide);
      if (frozenRef.current) setLineLeft({ index: activeChunkIndex, ms: remaining() });
    };
  }, [autoRunning, frozen, activeChunkIndex, msPerMatra, chunks, nextChunk]);

  const learning = isLearning(phase);
  const handleChunkClick = (index: number) => {
    if (guest) return;
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

  // Every source this prakaram reads, in order of first appearance, so the player cites them all at the end.
  const sources = useMemo(() => {
    const out: ArticleSource[] = [];
    const seen = new Set<string>();
    for (const chunk of chunks) {
      if (!chunk.sourceId || seen.has(chunk.sourceId)) continue;
      const doc = SUKTA_MAP.get(chunk.sourceId);
      if (!doc) continue;
      seen.add(chunk.sourceId);
      out.push({ doc, id: chunk.sourceId });
    }
    return out;
  }, [chunks]);

  const kindLabel = (kind: string) => (kind === 'shloka' ? 'Shloka' : 'Vakya');
  return (
    <div className="main-content">
      <div className={`chunks-container ${showTranslation ? 'with-translation' : ''}`} ref={containerRef}>
        {chunks.map((chunk, idx) => {
          const isActive = idx === activeChunkIndex;
          const bundled = chunk.translation;
          const translation = bundled ?? translations[idx];
          const pending = showTranslation && !bundled && !(idx in translations);
          return (
            <div
              key={`${chunk.id}-${idx}`}
              ref={isActive ? activeChunkRef : null}
              data-translation-row={idx}
              className={`chunk-row ${isActive ? 'active' : ''} ${Math.abs(idx - activeChunkIndex) === 1 ? 'is-near' : ''}`}
              onClick={() => handleChunkClick(idx)}
              onPointerDown={() => {
                if (!isActive || guest) return;
                // Touching the current line pauses at once. In auto modes the touch does not advance; in Learn it still counts as a tap.
                pressed.current = true;
                suppressClick.current = isAutoRunning(useCadenceStore.getState());
                setHolding(true);
              }}
              onPointerUp={() => {
                if (!pressed.current) return;
                pressed.current = false;
                setHolding(false);
              }}
              onPointerLeave={() => {
                if (!pressed.current) return;
                pressed.current = false;
                setHolding(false);
              }}
            >
              {chunk.section !== undefined && (
                <h2 className="chunk-heading" onClick={(e) => e.stopPropagation()}><Term id="anuvaka" /> {chunk.section}</h2>
              )}
              {chunk.padya !== undefined && <span className="chunk-padya" onClick={(e) => e.stopPropagation()}><Term id="padya" /> {chunk.padya}</span>}
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
                <Sanskrit text={chunk.sanskrit} />
              </div>
              {showTranslation && (translation || pending) && (
                <p className="chunk-translation">
                  {pending ? <span className="chunk-translation-pending">…</span> : translation}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {sources.length > 0 && (
        <footer className="player-sources">
          <h2 className="player-sources-title">Sources</h2>
          <SourceList sources={sources} />
          <p className="player-sources-note">Text is fetched live from the pinned upstream and never stored here.</p>
        </footer>
      )}
    </div>
  );
}
