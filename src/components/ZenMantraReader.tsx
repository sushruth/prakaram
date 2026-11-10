import { KriyaNote } from './KriyaNote';
import { Fragment } from 'preact';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'preact/hooks';
import { useMantraStore } from '../stores/useMantraStore';
import { isAutoRunning, useCadenceStore } from '../stores/useCadenceStore';
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
import { Sanskrit, SanskritTitle } from './Sanskrit';
import { PageNav } from './PageNav';
import { splitVerseNumber } from '../services/chunking';
import { keepPadasWhole, showActivePage, snapToPage } from '../services/bookPages';
import { Term } from './Term';
import { SourceList } from './SourceList';
import { SUKTA_MAP } from '../data';
import type { ArticleSource } from '../services/wiki';
import { chantingRoom } from '../services/webrtcRoom';

export function ZenMantraReader() {
  const fontSize = useSettingsStore((s) => s.fontSize);
  const script = useSettingsStore((s) => s.script);
  // Off unless the translation experiment is explicitly enabled (src/config/features.ts).
  const showTranslation = TRANSLATION_ENABLED && useSettingsStore((s) => s.showTranslation);

  const toggleZenMode = useMantraStore((s) => s.toggleZenMode);
  const activeChunkIndex = useMantraStore((s) => s.activeChunkIndex);
  const setActiveChunkIndex = useMantraStore((s) => s.setActiveChunkIndex);
  const openPrakara = useMantraStore((s) => s.openPrakara);
  const prevChunk = useMantraStore((s) => s.prevChunk);
  const nextChunk = useMantraStore((s) => s.nextChunk);

  const autoRunning = useCadenceStore(isAutoRunning);
  const frozen = useFrozen();
  const guest = useGuest();
  const frozenRef = useRef(frozen);
  frozenRef.current = frozen;
  const msPerMatra = useCadenceStore((s) => s.msPerMatra);

  const getActivePrakara = usePrakaraStore((s) => s.getActivePrakara);
  const isHost = useRoomStore((s) => s.isHost);
  const isInRoom = useRoomStore((s) => s.isInRoom);

  const activePrakara = getActivePrakara();
  const chunks = useChunks();
  const { containerRef, translations } = useChunkTranslations(chunks, showTranslation);

  useEffect(() => {
    openPrakara(activePrakara.id);
  }, [activePrakara.id, openPrakara]);

  useEffect(() => {
    if (chunks.length > 0 && activeChunkIndex >= chunks.length) setActiveChunkIndex(0);
  }, [chunks.length, activeChunkIndex, setActiveChunkIndex]);

  useEffect(() => showActivePage('smooth'), [activeChunkIndex]);
  // A new prakaram, text size or screen size re-cuts the pages; jump straight to the highlight's page.
  useLayoutEffect(() => {
    const relayout = () => {
      keepPadasWhole();
      showActivePage('instant');
    };
    relayout();
    document.fonts.ready.then(relayout);
    const el = document.querySelector('.book');
    if (!el) return;
    const observer = new ResizeObserver(relayout);
    observer.observe(el);
    return () => observer.disconnect();
  }, [chunks, fontSize, script]);

  const settle = useRef<ReturnType<typeof setTimeout>>();
  const onBookScroll = () => {
    clearTimeout(settle.current);
    settle.current = setTimeout(snapToPage, 150);
  };

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

  return (
    <div className="main-content book-main">
      <PageNav chunks={chunks} />
      <div className="book" style={{ fontSize: `${fontSize}px` }} onScroll={onBookScroll}>
        <div className={`book-text vedic-text ${showTranslation ? 'with-translation' : ''}`} ref={containerRef}>
          {chunks.map((chunk, idx) => {
            const translation = chunk.translation ?? translations[idx];
            return (
              <Fragment key={`${chunk.id}-${idx}`}>
                {chunk.kriya && (
                  <h2 className="book-kriya">
                    <SanskritTitle title={chunk.kriya} full />
                    <KriyaNote note={chunk.note} />
                  </h2>
                )}
                {/* A kriyā's heading already says where it starts; only a new anuvāka inside it gets a marker. */}
                {chunk.section !== undefined && !chunk.kriya && (
                  <span className="book-anuvaka"><Term id="anuvaka" /> {chunk.section}</span>
                )}
                {chunk.breakBefore && !chunk.kriya && <span className="book-break" aria-hidden="true" />}
                {/* A kriyā with no heading of its own (a silent reference) keeps its note as an asterisk before its text. */}
                {!chunk.kriya && <KriyaNote note={chunk.note} />}
                <PadaText text={chunk.sanskrit} className={`pada ${lineClass(chunk)} ${idx === activeChunkIndex ? 'active' : ''}`} index={idx} />
                {showTranslation && translation && <span className="pada-translation">{translation}</span>}{' '}
              </Fragment>
            );
          })}
          {sources.length > 0 && (
            <footer className="player-sources">
              <h2 className="player-sources-title">Sources</h2>
              <SourceList sources={sources} />
              <p className="player-sources-note">Text is fetched live from the pinned upstream and never stored here.</p>
            </footer>
          )}
          <div className="book-tail" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

/**
 * A pada's chanted text, with its printed verse number beside it, outside the highlighted span: only what is said
 * aloud lights up, and the number never takes part in the highlight's fade.
 */
function PadaText({ text, className, index }: { text: string; className: string; index: number }) {
  const [said, number] = splitVerseNumber(text);
  return (
    <>
      <span data-translation-row={index} className={className}>
        <Sanskrit text={said} />
      </span>
      {number && <span className="pada-number"><Sanskrit text={number} /></span>}
    </>
  );
}
