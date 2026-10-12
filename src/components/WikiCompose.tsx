import { useState } from 'preact/hooks';
import { rangeWords, resolveNirdesa } from '../services/nirdesa';
import { getArticle } from '../services/wiki';
import { articleHash } from '../services/wikiNav';
import { basketToPrakara } from '../services/basket';
import { ArticleTitle } from './Sanskrit';
import { useBasketStore } from '../stores/useBasketStore';
import { usePrakaraStore } from '../stores/usePrakaraStore';

/** '§3 lines 3–9', '§3.2–§4.5', or the section's title for a whole section. */
const part = ({ nirdesa, sections }: Extract<ReturnType<typeof resolveNirdesa>, { ok: true }>) =>
  nirdesa.line === undefined ? sections[0].title : nirdesa.to && nirdesa.to.section !== nirdesa.section ? rangeWords(nirdesa) : `§${nirdesa.section} ${rangeWords(nirdesa)}`;

/** Special:Compose: the basket in order, with a name, a line total, and the two ways to finish. */
export function WikiCompose() {
  const items = useBasketStore((s) => s.items);
  const { remove, move, clear } = useBasketStore.getState();
  const [name, setName] = useState('');

  const rows = items.flatMap((i) => {
    const r = resolveNirdesa(i);
    return r.ok ? [{ id: i, r }] : [];
  });
  const total = rows.reduce((n, x) => n + x.r.chunks.length, 0);

  const finish = (followNow: boolean) => {
    usePrakaraStore.getState().addPrakara(basketToPrakara(items, name));
    clear();
    if (followNow) window.location.hash = '';
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
          <li>Come back here to order and follow them.</li>
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
              <a href={articleHash(r.r.document.id)}><ArticleTitle title={r.r.document.title} /></a>
              {r.r.nirdesa.section !== undefined && <span className="wiki-muted"> · {part(r.r)}</span>}
              <span className="wiki-muted"> · {r.r.chunks.length} lines</span>
              <span className="wiki-muted"> · brings {[...new Set(getArticle(r.r.document.id)?.media.map((m) => m.kind))].join(', ')}</span>
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
        <button type="button" className="btn-primary" onClick={() => finish(true)}>Follow now</button>
        <button type="button" onClick={() => finish(false)}>Save to my prakarams</button>
      </div>
    </div>
  );
}
