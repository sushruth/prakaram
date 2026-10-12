import { useSettingsStore } from '../stores/useSettingsStore';
import { articlesForName, listArticles, listCategories, type WikiArticle } from '../services/wiki';
import { articleHash, articleLabel, categoryHash } from '../services/wikiNav';

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
  const script = useSettingsStore((s) => s.script);
  const articles = listArticles();
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
      <h1>Koshah — the free, open library of Vedic chants with swara</h1>
      <p className="wiki-muted">
        {articles.length} articles · {lines} lines
      </p>

      <div className="wiki-grid">
        {featured && (
          <section className="wiki-box wiki-featured">
            <h2>Featured article</h2>
            <a className="wiki-result-title" href={articleHash(featured.id)}>
              {articleLabel(featured, script)}
            </a>
            <p>{featured.summary}</p>
          </section>
        )}

        <section className="wiki-box">
          <h2>Browse by Veda</h2>
          <ul className="wiki-inline">
            {vedas.map((v) => (
              <li key={v.name}>
                <a href={categoryHash(v.name)}>{v.name}</a> <span className="wiki-muted">{v.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="wiki-box">
          <h2>Browse by deity</h2>
          <ul className="wiki-inline">
            {deities.map((d) => (
              <li key={d.name}>
                <a href={categoryHash(d.name)}>{d.name}</a> <span className="wiki-muted">{d.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="wiki-box">
          <h2>Categories</h2>
          <ul className="wiki-list">
            {categories.map((c) => (
              <li key={c.name}>
                <a href={categoryHash(c.name)}>{c.name}</a> <span className="wiki-muted">{c.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="wiki-box">
          <h2>Recently added</h2>
          <ul className="wiki-list">
            {recent.map((a) => (
              <li key={a.id}>
                <a href={articleHash(a.id)}>{articleLabel(a, script)}</a>
              </li>
            ))}
          </ul>
        </section>

        <section className="wiki-box">
          <h2>Compile your own prakaram</h2>
          <p>Put pieces from the library together into one sequence, and chant it in the player.</p>
          <a className="wiki-action" href="#compose">
            Open the composer
          </a>
        </section>
      </div>
    </div>
  );
}
