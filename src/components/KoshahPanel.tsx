import { useState } from 'preact/hooks';
import { DropHead, DropPanel } from './DropPanel';
import { usePrakaraStore } from '../stores/usePrakaraStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { ALL_SUKTAMS } from '../data';
import { KoshahPiece, listPieces, searchPieces } from '../services/koshah';
import { transliterateVedic } from '../services/transliteration';
import { splitTitle } from '../services/titles';

const PIECES = listPieces(ALL_SUKTAMS);

interface KoshahPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** Open the prakara composer (the existing modal). */
  onCompose: () => void;
}

interface PieceRowProps {
  piece: KoshahPiece;
  indent?: boolean;
  /** Set on a whole sukta that has sections: the toggle that shows them. */
  sections?: { count: number; expanded: boolean; onToggle: () => void };
  onClose: () => void;
}

function PieceRow({ piece, indent, sections, onClose }: PieceRowProps) {
  const script = useSettingsStore((s) => s.script);
  const read = () => {
    window.location.hash = '#k=' + encodeURIComponent(piece.id);
    onClose();
  };
  const run = () => {
    usePrakaraStore.getState().runPiece(piece.id);
    onClose();
  };

  return (
    <div className={`koshah-piece${indent ? ' koshah-indent' : ''}`}>
      <div className="koshah-piece-title">{transliterateVedic(piece.title.sanskrit, script)}</div>
      <div className="koshah-muted">{piece.title.english}</div>
      <div className="koshah-piece-foot">
        <span className="koshah-muted">{`${piece.lines} lines · ${piece.status}`}</span>
        <span className="koshah-actions">
          {sections && (
            <button className="koshah-action" aria-expanded={sections.expanded} onClick={sections.onToggle}>
              {`${sections.count} anuvakas ${sections.expanded ? '▴' : '▾'}`}
            </button>
          )}
          <button className="koshah-action" onClick={read}>Read</button>
          <button className="koshah-action" onClick={run}>Run</button>
        </span>
      </div>
    </div>
  );
}

// ponytail: no per-group virtualising, the Koshah is 8 suktas plus their anuvakas.
export function KoshahPanel({ isOpen, onClose, onCompose }: KoshahPanelProps) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const prakaras = usePrakaraStore((s) => s.prakaras);
  const activeId = usePrakaraStore((s) => s.activePrakaraId);
  const selectPrakara = usePrakaraStore((s) => s.selectPrakara);
  const script = useSettingsStore((s) => s.script);

  const searching = query.trim() !== '';
  const q = query.trim().toLowerCase();
  const shownPrakaras = prakaras.filter(
    (p) => !searching || [p.title, p.description].some((t) => t.toLowerCase().includes(q)),
  );
  const shownPieces = searching ? searchPieces(PIECES, query) : PIECES.filter((p) => p.kind === 'sukta');
  const nothing = searching && shownPrakaras.length === 0 && shownPieces.length === 0;

  const toggle = (documentId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(documentId)) next.delete(documentId);
      else next.add(documentId);
      return next;
    });

  return (
    <DropPanel label="Koshah" isOpen={isOpen} onClose={onClose}>
      <DropHead title="Koshah" onClose={onClose} />

      <div className="koshah-body">
        <input
          className="koshah-search"
          type="text"
          placeholder="Search the Koshah"
          value={query}
          onInput={(e) => setQuery(e.currentTarget.value)}
        />

        {(shownPrakaras.length > 0 || !searching) && (
          <div className="koshah-group">
            <h3 className="koshah-group-title">Prakarams</h3>
            {shownPrakaras.map((p) => {
              const split = splitTitle(p.title);
              const isActive = p.id === activeId;
              return (
                <button
                  key={p.id}
                  className={`koshah-row${isActive ? ' is-active' : ''}`}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => {
                    selectPrakara(p.id);
                    onClose();
                  }}
                >
                  <span className="koshah-piece-title">{transliterateVedic(split.sanskrit, script)}</span>
                  <span className="koshah-muted">{p.description}</span>
                </button>
              );
            })}
            <button className="koshah-compose" onClick={onCompose}>+ Compile new prakara</button>
          </div>
        )}

        {shownPieces.length > 0 && (
          <div className="koshah-group">
            <h3 className="koshah-group-title">Pieces</h3>
            {searching
              ? shownPieces.map((piece) => <PieceRow key={piece.id} piece={piece} onClose={onClose} />)
              : shownPieces.map((piece) => {
                  const children = PIECES.filter((p) => p.kind === 'anuvaka' && p.documentId === piece.documentId);
                  const isOpenSections = expanded.has(piece.documentId);
                  return (
                    <div key={piece.id}>
                      <PieceRow
                        piece={piece}
                        onClose={onClose}
                        sections={
                          children.length > 0
                            ? { count: children.length, expanded: isOpenSections, onToggle: () => toggle(piece.documentId) }
                            : undefined
                        }
                      />
                      {isOpenSections &&
                        children.map((child) => <PieceRow key={child.id} piece={child} indent onClose={onClose} />)}
                    </div>
                  );
                })}
          </div>
        )}

        {nothing && <p className="koshah-muted">Nothing found</p>}
      </div>
    </DropPanel>
  );
}
