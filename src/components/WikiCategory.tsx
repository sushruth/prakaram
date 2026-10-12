import { useSettingsStore } from '../stores/useSettingsStore';
import { articlesInCategory, listArticles } from '../services/wiki';
import { articleHash, articleLabel } from '../services/wikiNav';

/** The pages in a category. A Veda or deity name also lists the pages that carry it, so the home page links work. */
export function WikiCategory({ name }: { name: string }) {
  const script = useSettingsStore((s) => s.script);
  const want = name.trim().toLowerCase();
  const items = [
    ...articlesInCategory(name),
    ...listArticles().filter(
      (a) =>
        (a.veda?.toLowerCase() === want || a.deity?.toLowerCase() === want) &&
        !a.categories.some((c) => c.toLowerCase() === want),
    ),
  ];

  return (
    <div className="wiki-page">
      <h1>Category: {name}</h1>
      <p className="wiki-muted">
        {items.length} {items.length === 1 ? 'page' : 'pages'}
      </p>
      {items.length === 0 && <p>No pages in this category yet.</p>}
      <ul className="wiki-results">
        {items.map((a) => (
          <li key={a.id}>
            <a className="wiki-title" href={articleHash(a.id)}>
              {articleLabel(a, script)}
            </a>
            {a.title.english && <span className="wiki-muted"> {a.title.english}</span>}
            <p>{a.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
