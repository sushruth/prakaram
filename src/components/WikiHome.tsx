import { ArticleTitle } from './Sanskrit';
import { articlesForName, listArticles, listCategories, type WikiArticle } from '../services/wiki';
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

export function WikiHome() {
  const all = listArticles();
  const articles = all.filter((a) => a.kind === 'source');
  const categories = listCategories();
  const lines = articles.reduce((n, a) => n + a.lines, 0);
  // Rotates by day (UTC). Same article all day, the next one tomorrow.
  const featured = articles[Math.floor(Date.now() / DAY_MS) % Math.max(articles.length, 1)];
  // ponytail: no date on articles, so "recent" is the last five in corpus order.
  const recent = articles.slice(-5).reverse();
  const vedas = tally(articles, (a) => a.veda);
  const deities = tally(articles, (a) => a.deity);

  return (
    <div className="wiki-page">
      <h1 className="wiki-welcome">Koshah, the free, open library of Vedic chants with swara.</h1>
      <p className="wiki-figures">
        <span><b>{articles.length}</b> <span className="wiki-muted">articles</span></span>
        <span><b>{lines}</b> <span className="wiki-muted">padas</span></span>
      </p>

      <div className="wiki-grid">
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
          <h2>Recently added</h2>
          <ul className="wiki-list">
            {recent.map((a) => (
              <li key={a.id}>
                <a href={articleHash(a.id)}><ArticleTitle title={a.title} /></a>
              </li>
            ))}
          </ul>
        </section>

        <section className="wiki-block">
          <h2>Compile your own prakaram</h2>
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
