import { useEffect, useRef, useState } from 'preact/hooks';
import { ALL_SUKTAMS } from '../data';
import { findPiece, pieceChunks } from '../services/koshah';
import { pratika, type WikiSection } from '../services/wiki';
import { articleHash, sectionDomId } from '../services/wikiNav';
import { ArticleTitle, Sanskrit, useCiteInWords } from './Sanskrit';
import { AddToPrakaram } from './WikiAdd';
import type { MantraDocument } from '../types/mantra';

/** The first few padas of a section, as a one-line preview. */
const lines = (s: WikiSection) => {
  const piece = findPiece(ALL_SUKTAMS, s.pieceId);
  return piece ? pieceChunks(ALL_SUKTAMS, piece).slice(0, 3).map((c) => c.sanskrit) : [];
};

/** Contents: a fade-in text list of a source's sections, to jump to one, follow it or add it, without scrolling the text. */
export function Contents({ id, doc, sections, onRun }: { id: string; doc?: MantraDocument; sections: WikiSection[]; onRun: (pieceId: string) => void }) {
  const [open, setOpen] = useState(false);
  const cite = useCiteInWords();
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLElement>('.wiki-contents-jump')?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      btn.current?.focus();
    };
    const away = (e: Event) => root.current && !root.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('keydown', key);
    document.addEventListener('pointerdown', away);
    return () => {
      document.removeEventListener('keydown', key);
      document.removeEventListener('pointerdown', away);
    };
  }, [open]);
  const jump = (e: MouseEvent, n: number) => {
    setOpen(false);
    if (location.hash !== articleHash(id, n)) return; // the route change scrolls
    e.preventDefault();
    document.getElementById(sectionDomId(n))?.scrollIntoView({ block: 'start' });
  };
  return (
    <div className="wiki-contents" ref={root}>
      <button ref={btn} type="button" className="wiki-link wiki-contents-btn" aria-expanded={open} aria-controls="wiki-contents-list" onClick={() => setOpen(!open)}>
        Contents
      </button>
      {open && (
        <ol id="wiki-contents-list" className="wiki-contents-list">
          {doc?.metadata.place && <li className="wiki-contents-cite wiki-muted">{cite(doc, id)}</li>}
          {sections.map((s) => (
            <li key={s.id}>
              <a className="wiki-contents-jump" href={articleHash(id, s.number)} onClick={(e) => jump(e, s.number)}>
                <span className="wiki-contents-n">{s.number}</span> <ArticleTitle title={{ sanskrit: '', english: s.title }} />{' '}
                <span className="wiki-muted">· <Sanskrit text={pratika(lines(s))} /></span>
              </a>
              <span className="wiki-contents-acts">
                <button type="button" className="wiki-link" onClick={() => { setOpen(false); onRun(s.pieceId); }}>Follow</button>
                <AddToPrakaram pieceIds={[s.pieceId]} />
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
