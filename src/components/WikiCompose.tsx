import { useState } from 'preact/hooks';
import { partWords, resolveNirdesa } from '../services/nirdesa';
import { sankalpaOf } from '../services/basket';
import { getArticle } from '../services/wiki';
import { articleHash } from '../services/wikiNav';
import { basketToPrakara } from '../services/basket';
import { ArticleTitle, useCiteInWords } from './Sanskrit';
import { Term } from './Term';
import { useBasketStore } from '../stores/useBasketStore';
import { usePrakaraStore } from '../stores/usePrakaraStore';

/** '§3 padas 3–9', '§3 ṛks 2–4', '§3 pada 2 – §4 pada 5', or the section's title for a whole section. */
const part = ({ nirdesa, sections }: Extract<ReturnType<typeof resolveNirdesa>, { ok: true }>) =>
  nirdesa.pada === undefined && !nirdesa.padya ? sections[0].title : partWords(nirdesa);

/** Special:Compose: the basket's kriyās in order, each with an optional kriyā name and its sankalpa line, a pada total, and the two ways to finish. */
export function WikiCompose() {
  const items = useBasketStore((s) => s.items);
  const names = useBasketStore((s) => s.names);
  const { remove, move, clear, setName: setKriyaName } = useBasketStore.getState();
  const cite = useCiteInWords();
  const [name, setName] = useState('');

  const rows = items.flatMap((i) => {
    const r = resolveNirdesa(i);
    return r.ok ? [{ id: i, r }] : [];
  });
  const total = rows.reduce((n, x) => n + x.r.chunks.length, 0);

  const finish = (followNow: boolean) => {
    usePrakaraStore.getState().addPrakara(basketToPrakara(items, name, Date.now(), names));
    clear();
    if (followNow) window.location.hash = '';
    else setName('');
  };

  if (rows.length === 0) {
    return (
      <div className="wiki-page">
        <h1>My prakaram</h1>
        <p>Nothing here yet. Composing takes three steps; each text you add becomes a <Term id="kriya">kriyā</Term> (a step of the prakaram).</p>
        <ol className="wiki-steps">
          <li>Open any article.</li>
          <li>Tap Add to my prakaram on a whole text, a section, a <Term id="padya">ṛk</Term> or some <Term id="pada">padas</Term>.</li>
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
        {rows.length} <Term id="kriya">{rows.length === 1 ? 'kriyā' : 'kriyās'}</Term>, {total} padas
      </p>
      <ol className="wiki-list" style={{ margin: '1.5rem 0 0', paddingLeft: 0, listStyle: 'none' }}>
        {rows.map((r, i) => (
          <li key={r.id} className="wiki-compose-item">
            <span className="wiki-compose-what">
              <a href={articleHash(r.r.document.id)}><ArticleTitle title={r.r.document.title} /></a>
              {r.r.nirdesa.section !== undefined && <span className="wiki-muted"> · {part(r.r)}</span>}
              <span className="wiki-muted"> · {r.r.chunks.length} padas</span>
              <span className="wiki-compose-cite wiki-muted">{cite(r.r.document, r.id)}</span>
              <span className="wiki-muted"> · <Term id="samagri">brings</Term> {[...new Set(getArticle(r.r.document.id)?.media.map((m) => m.kind))].join(', ')}</span>
            </span>
            {r.r.nirdesa.pada === undefined && !r.r.nirdesa.padya && (
              <span className="wiki-compose-kriya">
                <input
                  className="wiki-kriya"
                  type="text"
                  placeholder="kriyā name (optional), e.g. kalaśārādhanaṁ"
                  aria-label="Kriyā name"
                  value={names[r.id] ?? ''}
                  onInput={(e) => setKriyaName(r.id, e.currentTarget.value)}
                />
                {names[r.id]?.trim() && <span className="wiki-muted">{sankalpaOf(names[r.id])}</span>}
              </span>
            )}
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
