import { ArticleTitle } from './Sanskrit';
import { Term } from './Term';
import { LIVE_SOURCES, liveSourceLabel } from '../data/liveSources';
import { DEFAULT_PRAKARAS } from '../data';
import { TOP_BROWSED, type HomePick } from '../data/topBrowsed';
import { seasonAt } from '../data/seasonal';
import { articlesForName, getArticle, listArticles, listCategories, type WikiArticle } from '../services/wiki';
import { useRecentStore } from '../stores/useRecentStore';
import { COMPOSE_HASH, articleHash, categoryHash } from '../services/wikiNav';

const DAY_MS = 86_400_000;

/** Each distinct value of one field, with how many articles have it. */
function tally(articles: WikiArticle[], field: (a: WikiArticle) => string | undefined) {
  const counts = new Map<string, number>();
  for (const a of articles) {
    const v = field(a);
    if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts].map(([name]) => ({ name, count: articlesForName(name).length })).sort((x, y) => x.name.localeCompare(y.name));
}

/** A label for an id the home links to: a loaded article's English title, else the live source's label, else the id. */
const labelFor = (id: string) => getArticle(id)?.title.english ?? liveSourceLabel(id) ?? id;

/** A plain text list of links to articles. */
function PickList({ picks }: { picks: HomePick[] }) {
  return (
    <ul className="wiki-list">
      {picks.map((p) => (
        <li key={p.id}>
          <a href={articleHash(p.id)}>{p.label}</a>
        </li>
      ))}
    </ul>
  );
}

/**
 * The front page. Order is by what a reader is most likely to want first: the articles they opened
 * (Recently used), then a seasonal placeholder, a static "top browsed" placeholder, then the browse
 * blocks. Counts describe the catalog the home offers, not the (empty until loaded) bundled corpus.
 */
export function WikiHome() {
  const all = listArticles();
  const articles = all.filter((a) => a.kind === 'source');
  const categories = listCategories();
  const recentIds = useRecentStore((s) => s.ids);
  const season = seasonAt(new Date());
  // Rotates by day (UTC). Same article all day, the next one tomorrow.
  const featured = articles[Math.floor(Date.now() / DAY_MS) % Math.max(articles.length, 1)];
  const vedas = tally(articles, (a) => a.veda);
  const deities = tally(articles, (a) => a.deity);

  return (
    <div className="wiki-page">
      <h1 className="wiki-welcome"><Term id="koshah">Koshah</Term>, the free, open library of Vedic chants with swara.</h1>
      <p className="wiki-figures">
        <span><b>{LIVE_SOURCES.length}</b> <span className="wiki-muted">live sources</span></span>
        <span><b>{DEFAULT_PRAKARAS.length}</b> <span className="wiki-muted">compositions</span></span>
      </p>

      <div className="wiki-grid">
        {recentIds.length > 0 && (
          <section className="wiki-block">
            <h2>Recently used</h2>
            <PickList picks={recentIds.map((id) => ({ id, label: labelFor(id) }))} />
          </section>
        )}

        <section className="wiki-block">
          <h2>Season / festival</h2>
          <p className="wiki-muted">{season.name}</p>
          <PickList picks={season.picks} />
        </section>

        <section className="wiki-block">
          <h2>Top browsed</h2>
          <PickList picks={TOP_BROWSED} />
        </section>

        {featured && (
          <section className="wiki-block wiki-featured">
            <h2>Featured article</h2>
            <a className="wiki-result-title" href={articleHash(featured.id)}>
              <ArticleTitle title={featured.title} />
            </a>
            <p>{featured.summary}</p>
          </section>
        )}

        <section className="wiki-block">
          <h2>Browse by Veda</h2>
          <ul className="wiki-inline">
            {vedas.map((v) => (
              <li key={v.name}>
                <a href={categoryHash(v.name)}>{v.name}</a> <span className="wiki-muted">{v.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="wiki-block">
          <h2>Browse by kind</h2>
          <ul className="wiki-inline">
            {(['source', 'composition'] as const).map((k) => (
              <li key={k}>
                <a href={categoryHash(`${k}s`)}>{k === 'source' ? 'Sources' : 'Compositions'}</a>{' '}
                <span className="wiki-muted">{all.filter((a) => a.kind === k).length}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="wiki-block">
          <h2>Browse by deity</h2>
          <ul className="wiki-inline">
            {deities.map((d) => (
              <li key={d.name}>
                <a href={categoryHash(d.name)}>{d.name}</a> <span className="wiki-muted">{d.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="wiki-block">
          <h2>Categories</h2>
          <ul className="wiki-list">
            {categories.map((c) => (
              <li key={c.name}>
                <a href={categoryHash(c.name)}>{c.name}</a> <span className="wiki-muted">{c.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="wiki-block">
          <h2>Live sources</h2>
          <p className="wiki-muted">Fetched from their pinned edition when opened.</p>
          <ul className="wiki-list">
            {LIVE_SOURCES.map((s) => (
              <li key={s.id}>
                <a href={articleHash(s.id)}>{s.label}</a>
              </li>
            ))}
          </ul>
        </section>

        <section className="wiki-block">
          <h2>Compile your own <Term id="prakaram">prakaram</Term></h2>
          <p>Add a whole text or a single section from any article, put them in order, and follow them in the player.</p>
          <a className="wiki-action" href={COMPOSE_HASH}>
            Start composing
          </a>
          <p>
            <a href="#compose">Open the player composer</a>
          </p>
        </section>
      </div>
    </div>
  );
}
