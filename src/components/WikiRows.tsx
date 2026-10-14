import { Sanskrit, ArticleTitle } from './Sanskrit';
import { AddToPrakaram } from './WikiAdd';
import { lineClass } from '../config/lineClass';
import { articleHash, lineDomId, sectionDomId } from '../services/wikiNav';
import type { Pos } from '../services/nirdesa';
import type { HeadingRow, LineRow } from '../services/wikiRows';

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

/** One pada: its number and padya number (in a source), and the text. */
export function WikiLineRow({
  row,
  fontSize,
  picked,
  tap,
  rowRef,
}: {
  row: LineRow;
  fontSize: number;
  picked: (p: Pos) => boolean;
  tap: (p: Pos) => void;
  rowRef: RowRef;
}) {
  const { chunk, pos, own, groups, endOf } = row;
  return (
    <p
      id={lineDomId(pos)}
      className={`wiki-line vedic-text ${lineClass(chunk)}`}
      style={{ fontSize: `${fontSize}px` }}
      data-numbered={own ? '' : undefined}
      data-padya={groups ? '' : undefined}
      ref={rowRef}
    >
      {own && (
        <button type="button" className="wiki-ln" data-in={picked(pos) ? '' : undefined} aria-label={`Pada ${pos.pada}`} aria-pressed={picked(pos)} onClick={() => tap(pos)}>
          {pos.pada}
        </button>
      )}
      {endOf && (
        <button type="button" className="wiki-pn" data-in={picked(pos) ? '' : undefined} aria-label={`Ṛk ${endOf.number}`} onClick={() => tap(pos)}>
          {endOf.number}
        </button>
      )}
      <span>
        <Sanskrit text={chunk.sanskrit} />
      </span>
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
  rowRef,
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
  rowRef: RowRef;
}) {
  return (
    <p className="wiki-range" ref={rowRef}>
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
    </p>
  );
}
