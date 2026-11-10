import { KriyaNote } from './KriyaNote';
import { Sanskrit, ArticleTitle } from './Sanskrit';
import { AddToPrakaram } from './WikiAdd';
import { lineClass } from '../config/lineClass';
import { articleHash, lineDomId, sectionDomId } from '../services/wikiNav';
import type { Pos } from '../services/nirdesa';
import type { HeadingRow, ProseRow } from '../services/wikiRows';
import { Fragment, type ComponentChildren } from 'preact';

/** Attaches the windowing hook's `measure(index)` to a row's root element. */
export type RowRef = (el: HTMLElement | null) => void;

/** A section heading: the number, title, source note and its follow/add/edit actions. */
export function WikiHeadingRow({
  row,
  sectionCount,
  composition,
  editUrl,
  onRun,
  rowRef,
}: {
  row: HeadingRow;
  sectionCount: number;
  composition: boolean;
  editUrl: string;
  onRun: (pieceId: string) => void;
  rowRef: RowRef;
}) {
  const s = row.section;
  return (
    <h2 id={sectionDomId(s.number)} tabIndex={-1} className="wiki-section-title" ref={rowRef}>
      {s.number}. {s.title}
      <KriyaNote note={s.note} />
      {s.from && (
        <span className="wiki-from">
          {' '}
          from{' '}
          <a href={`${articleHash(s.from.id)}/${s.from.number}`}>
            <ArticleTitle title={{ sanskrit: s.from.sanskrit, english: s.from.title }} />
          </a>{' '}
          §{s.from.number}
        </span>
      )}
      <span className="wiki-section-actions">
        <button type="button" className="wiki-link" onClick={() => onRun(s.pieceId)}>
          [follow]
        </button>
        {(sectionCount > 1 || composition) && <AddToPrakaram pieceIds={[s.pieceId]} />}
        <a href={editUrl}>[edit]</a>
      </span>
    </h2>
  );
}

/** A section's padas as running text, as in the book view; in a source each pada has a small number to pick ranges with. */
export function WikiProseRow({
  row,
  fontSize,
  picked,
  tap,
  after,
  rowRef,
}: {
  row: ProseRow;
  fontSize: number;
  picked: (p: Pos) => boolean;
  tap: (p: Pos) => void;
  /** The selection's actions, shown right after the pada at `pos`. */
  after?: { pos: Pos; node: ComponentChildren };
  rowRef: RowRef;
}) {
  return (
    <p className="wiki-prose vedic-text" style={{ fontSize: `${fontSize}px` }} ref={rowRef}>
      {row.padas.map(({ pos, chunk }) => (
        <Fragment key={`${chunk.id}-${pos.pada}`}>
          <span id={lineDomId(pos)} className={`wiki-pada ${lineClass(chunk)}`} data-in={picked(pos) ? '' : undefined}>
            {row.own && (
              <button type="button" className="wiki-ln" aria-label={`Pada ${pos.pada}`} aria-pressed={picked(pos)} onClick={() => tap(pos)}>
                {pos.pada}
              </button>
            )}
            <Sanskrit text={chunk.sanskrit} />
          </span>{' '}
          {after && after.pos.section === pos.section && after.pos.pada === pos.pada && after.node}
        </Fragment>
      ))}
    </p>
  );
}

/** The selection's actions: cite, follow, add, copy, refine to padas and clear. */
export function WikiRangeRow({
  citeText,
  addr,
  words,
  onRun,
  copied,
  onCopy,
  showRefine,
  byPada,
  onRefine,
  onClear,
}: {
  citeText: string | undefined;
  addr: string;
  words: string;
  onRun: (pieceId: string) => void;
  copied: boolean;
  onCopy: () => void;
  showRefine: boolean;
  byPada: boolean;
  onRefine: () => void;
  onClear: () => void;
}) {
  return (
    <span className="wiki-range">
      {citeText && <span className="wiki-range-cite wiki-muted">{citeText}</span>}
      <button type="button" className="wiki-link wiki-range-follow" onClick={() => onRun(addr)}>
        Follow {words}
      </button>
      <AddToPrakaram pieceIds={[addr]} />
      <button type="button" className="wiki-link" onClick={onCopy}>
        {copied ? 'Copied' : 'Copy link'}
      </button>
      {showRefine && (
        <button type="button" className="wiki-link wiki-refine" aria-pressed={byPada} onClick={onRefine}>
          padas
        </button>
      )}
      <button type="button" className="wiki-link" onClick={onClear}>
        clear
      </button>
    </span>
  );
}
