import { useState } from 'preact/hooks';
import { ALL_SUKTAMS } from '../data';
import { findPiece } from '../services/koshah';
import { getArticle } from '../services/wiki';
import { articleHash } from '../services/wikiNav';
import { basketToPrakara } from '../services/basket';
import { useBasketStore } from '../stores/useBasketStore';
import { usePrakaraStore } from '../stores/usePrakaraStore';

/** Special:Compose: the basket in order, with a name, a line total, and the two ways to finish. */
export function WikiCompose() {
  const items = useBasketStore((s) => s.items);
  const { remove, move, clear } = useBasketStore.getState();
  const [name, setName] = useState('');

  const rows = items.flatMap((i) => {
    const piece = findPiece(ALL_SUKTAMS, i.pieceId);
    return piece ? [{ id: i.pieceId, piece }] : [];
  });
  const total = rows.reduce((n, r) => n + r.piece.lines, 0);

  const finish = (chantNow: boolean) => {
    usePrakaraStore.getState().addPrakara(basketToPrakara(items, name));
    clear();
    if (chantNow) window.location.hash = '';
    else setName('');
  };

  if (rows.length === 0) {
    return (
      <div className="wiki-page">
        <h1>My prakaram</h1>
        <p>Nothing here yet. Composing takes three steps.</p>
        <ol className="wiki-steps">
          <li>Open any article.</li>
          <li>Tap Add to my prakaram on a whole text or on one section.</li>
          <li>Come back here to order and chant them.</li>
        </ol>
        <p className="wiki-muted">The player plays the text for now; other media are listed but not played.</p>
        <p>
          <a className="wiki-action" href="#/wiki">Browse articles</a>
        </p>
      </div>
    );
  }

  return (
    <div className="wiki-page">
      <h1>My prakaram</h1>
      <p className="wiki-muted">
        {rows.length} {rows.length === 1 ? 'piece' : 'pieces'}, {total} lines
      </p>
      <ol className="wiki-list" style={{ margin: '1.5rem 0 0', paddingLeft: 0, listStyle: 'none' }}>
        {rows.map((r, i) => (
          <li key={r.id} className="wiki-compose-item">
            <span className="wiki-compose-what">
              <a href={articleHash(r.piece.documentId)}>{r.piece.title.english.split(': ')[0]}</a>
              {r.piece.sectionId && <span className="wiki-muted"> · {r.piece.title.english.split(': ').slice(1).join(': ')}</span>}
              <span className="wiki-muted"> · {r.piece.lines} lines</span>
              <span className="wiki-muted"> · brings {[...new Set(getArticle(r.piece.documentId)?.media.map((m) => m.kind))].join(', ')}</span>
            </span>
            <button type="button" disabled={i === 0} onClick={() => move(r.id, -1)}>up</button>
            <button type="button" disabled={i === rows.length - 1} onClick={() => move(r.id, 1)}>down</button>
            <button type="button" onClick={() => remove(r.id)}>remove</button>
          </li>
        ))}
      </ol>
      <input
        className="wiki-name"
        type="text"
        placeholder="Name your prakaram"
        aria-label="Prakaram name"
        value={name}
        onInput={(e) => setName(e.currentTarget.value)}
      />
      <div className="wiki-compose-actions">
        <button type="button" className="btn-primary" onClick={() => finish(true)}>Chant now</button>
        <button type="button" onClick={() => finish(false)}>Save to my prakarams</button>
      </div>
    </div>
  );
}
