import { useEffect } from 'preact/hooks';
import { ALL_SUKTAMS } from '../data';
import { findPiece, pieceChunks } from '../services/koshah';
import { transliterateVedic } from '../services/transliteration';
import { lineClass } from '../config/lineClass';
import { useSettingsStore } from '../stores/useSettingsStore';
import { usePrakaraStore } from '../stores/usePrakaraStore';
import { renderVedic } from './renderVedic';
import { MantraChunk } from '../types/mantra';

const runInPlayer = (id: string, close: () => void) => {
  usePrakaraStore.getState().runPiece(id);
  close();
};

interface PieceViewProps {
  pieceId: string;
  /** Leave the piece page and go back to the player. */
  onClose: () => void;
}

const STATUS_NOTE = {
  draft: 'Draft: not yet proofread against a printed edition.',
  proofread: 'Proofread: checked against a printed edition, not yet reviewed.',
  reviewed: 'Reviewed: proofread, then checked a second time.',
} as const;

/** A standalone reading page for one Koshah piece. No player; the player is reached through "Run in the player". */
export function PieceView({ pieceId, onClose }: PieceViewProps) {
  const script = useSettingsStore((s) => s.script);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const piece = findPiece(ALL_SUKTAMS, pieceId);
  const englishTitle = piece?.title.english;

  useEffect(() => {
    if (!englishTitle) return;
    const previous = document.title;
    document.title = englishTitle;
    return () => {
      document.title = previous;
    };
  }, [englishTitle]);

  const backButton = (
    <button type="button" className="piece-action" onClick={onClose}>
      ← Koshah
    </button>
  );

  if (!piece) {
    return (
      <main className="piece-view">
        {backButton}
        <p className="piece-muted">This piece does not exist.</p>
      </main>
    );
  }

  const doc = ALL_SUKTAMS.find((d) => d.id === piece.documentId);
  // A whole multi-section sukta is read section by section; an anuvaka is one section and needs no captions.
  const grouped = piece.kind === 'sukta' && (doc?.sections.length ?? 0) > 1;
  const sections = doc?.sections.filter((s) => !piece.sectionId || s.id === piece.sectionId) ?? [];

  const renderChunks = (chunks: MantraChunk[]) =>
    chunks.map((chunk, i) => (
      <p key={`${chunk.id}-${i}`} className={`piece-line vedic-text ${lineClass(chunk)}`} style={{ fontSize: `${fontSize}px` }}>
        {renderVedic(chunk.sanskrit, script)}
      </p>
    ));

  return (
    <main className="piece-view">
      {backButton}

      <h1 className="piece-title vedic-text">{transliterateVedic(piece.title.sanskrit, script)}</h1>
      <p className="piece-subtitle">{piece.title.english}</p>

      <dl className="piece-meta">
        <dt>Source</dt>
        <dd>{piece.source}</dd>
        <dt>Status</dt>
        <dd>
          {piece.status}
          <span className="piece-note">{STATUS_NOTE[piece.status]}</span>
        </dd>
        <dt>Licence</dt>
        <dd>{piece.license ?? 'Not stated'}</dd>
        <dt>Lines</dt>
        <dd>{piece.lines}</dd>
      </dl>
      <p className="piece-note">Text may carry rights of its source; see the licence note.</p>

      <button type="button" className="piece-action piece-run" onClick={() => runInPlayer(piece.id, onClose)}>
        Run in the player
      </button>

      <div className="piece-body">
        {grouped
          ? sections.map((s) => (
              <section key={s.id}>
                <h2 className="piece-section">{s.title}</h2>
                {renderChunks(s.chunks)}
              </section>
            ))
          : renderChunks(pieceChunks(ALL_SUKTAMS, piece))}
      </div>
    </main>
  );
}
