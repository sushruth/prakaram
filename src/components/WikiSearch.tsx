import { ArticleTitle } from './Sanskrit';
import { searchArticles } from '../services/wiki';
import { REPO_URL, articleHash } from '../services/wikiNav';

/** A window of the text around the first match, with the match in <mark>. A match only in the title shows the start. */
function Snippet({ text, term }: { text: string; term: string }) {
  const at = text.toLowerCase().indexOf(term.toLowerCase());
  if (at < 0) return <>{text.slice(0, 160)}</>;
  const start = Math.max(0, at - 60);
  const end = Math.min(text.length, at + term.length + 120);
  return (
    <>
      {start > 0 && '…'}
      {text.slice(start, at)}
      <mark>{text.slice(at, at + term.length)}</mark>
      {text.slice(at + term.length, end)}
      {end < text.length && '…'}
    </>
  );
}

export function WikiSearch({ q }: { q: string }) {
  const term = q.trim();
  const results = term ? searchArticles(term) : [];

  return (
    <div className="wiki-page">
      <h1>Search</h1>
      {!term && <p className="wiki-muted">Type a word in the search box above.</p>}
      {term && (
        <p className="wiki-muted">
          {results.length} {results.length === 1 ? 'page' : 'pages'} for “{term}”
        </p>
      )}
      {term && results.length === 0 && (
        <p>
          No page matches “{term}”. <a href={REPO_URL}>Create this page</a> on GitHub.
        </p>
      )}
      <ul className="wiki-results">
        {results.map((a) => (
          <li key={a.id}>
            <a className="wiki-result-title" href={articleHash(a.id)}>
              <ArticleTitle title={a.title} />
            </a>
            {a.title.english && <span className="wiki-muted"> {a.title.english}</span>}
            <p>
              <Snippet text={a.summary} term={term} />
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
