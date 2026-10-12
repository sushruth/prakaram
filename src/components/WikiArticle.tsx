import { useEffect } from 'preact/hooks';
import { ALL_SUKTAMS } from '../data';
import { findPiece, pieceChunks } from '../services/koshah';
import { transliterateVedic } from '../services/transliteration';
import { getArticle, type WikiArticle as Article, type WikiSection } from '../services/wiki';
import { lineClass } from '../config/lineClass';
import { useSettingsStore } from '../stores/useSettingsStore';
import { renderVedic } from './renderVedic';

/** Where a reader creates an article that does not exist yet. */
// ponytail: placeholder until the repository URL is confirmed; set it to the real repo's new-file page.
const NEW_ARTICLE_URL = 'https://github.com/sushruth/prakaram/new/main/src/data';

const STATUS_LABEL = { draft: 'Draft', proofread: 'Proofread', reviewed: 'Reviewed' } as const;

const articleHref = (id: string) => `#/wiki/${encodeURIComponent(id)}`;
const sectionDomId = (n: number) => `wiki-s-${n}`;

interface WikiArticleProps {
  id: string;
  /** Section number to bring into view, from the `#/wiki/<id>/<n>` address. */
  section?: number;
  /** Play a piece in the player. Called with an article id or a section's piece id. */
  onRun: (pieceId: string) => void;
}

/** A Wikipedia-style article about one piece of the corpus: lead, infobox, contents and sections of text. */
export function WikiArticle({ id, section, onRun }: WikiArticleProps) {
  const script = useSettingsStore((s) => s.script);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const article = getArticle(id);
  const englishTitle = article?.title.english;

  useEffect(() => {
    if (!englishTitle) return;
    const previous = document.title;
    document.title = englishTitle;
    return () => {
      document.title = previous;
    };
  }, [englishTitle]);

  useEffect(() => {
    if (section === undefined) return;
    const target = document.getElementById(sectionDomId(section));
    target?.scrollIntoView({ block: 'start' });
    target?.focus({ preventScroll: true });
  }, [id, section]);

  if (!article) {
    return (
      <main className="wiki-article">
        <h1 className="wiki-title">{id}</h1>
        <p>This article does not exist yet.</p>
        <p>
          <a href={NEW_ARTICLE_URL} target="_blank" rel="noopener noreferrer">
            Create it on GitHub
          </a>
        </p>
      </main>
    );
  }

  const unconfirmed = article.status === 'draft' || /not yet confirmed/i.test(article.license ?? '');

  const renderSection = (s: WikiSection) => {
    const piece = findPiece(ALL_SUKTAMS, s.pieceId);
    return (
      <section key={s.id} className="wiki-section">
        <h2 id={sectionDomId(s.number)} tabIndex={-1} className="wiki-section-title">
          {s.number}. {s.title}
          <span className="wiki-section-actions">
            <button type="button" className="wiki-link" onClick={() => onRun(s.pieceId)}>
              [chant]
            </button>
            <a href={article.editUrl}>[edit]</a>
          </span>
        </h2>
        {piece ? (
          pieceChunks(ALL_SUKTAMS, piece).map((chunk, i) => (
            <p key={`${chunk.id}-${i}`} className={`wiki-line vedic-text ${lineClass(chunk)}`} style={{ fontSize: `${fontSize}px` }}>
              {renderVedic(chunk.sanskrit, script)}
            </p>
          ))
        ) : (
          <p className="wiki-muted">The text of this section is not available.</p>
        )}
      </section>
    );
  };

  return (
    <main className="wiki-article">
      <nav aria-label="Article views" className="wiki-tabs">
        <a href={articleHref(article.id)} aria-current="page">
          Article
        </a>
        <a href={articleHref(article.id)}>Read</a>
        <a href={article.editUrl}>Edit</a>
        <a href={article.historyUrl}>View history</a>
      </nav>

      <h1 className="wiki-title vedic-text">{transliterateVedic(article.title.sanskrit, script)}</h1>
      <p className="wiki-subtitle">{article.title.english}</p>

      {unconfirmed && (
        <p className="wiki-notice" role="note">
          <span className="wiki-notice-word">{STATUS_LABEL[article.status]}.</span> This text has not been proofread / permission pending.
        </p>
      )}

      <aside className="wiki-infobox" aria-label="Facts about this text">
        <button type="button" className="wiki-chant" onClick={() => onRun(article.id)}>
          ▶ Chant this
        </button>
        <dl>
          {article.veda && (
            <>
              <dt>Veda</dt>
              <dd>{article.veda}</dd>
            </>
          )}
          {article.deity && (
            <>
              <dt>Deity</dt>
              <dd>{article.deity}</dd>
            </>
          )}
          {article.usage && (
            <>
              <dt>Usage</dt>
              <dd>{article.usage}</dd>
            </>
          )}
          <dt>Source</dt>
          <dd>{article.source}</dd>
          <dt>Status</dt>
          <dd>
            <span className="wiki-status" data-status={article.status}>
              {STATUS_LABEL[article.status]}
            </span>
          </dd>
          <dt>Licence</dt>
          <dd>{article.license ?? 'Not stated'}</dd>
          <dt>Lines</dt>
          <dd>{article.lines}</dd>
        </dl>
      </aside>

      <p className="wiki-lead">{article.summary}</p>

      {article.sections.length > 0 && (
        <nav aria-labelledby="wiki-contents-title" className="wiki-toc">
          <h2 id="wiki-contents-title">Contents</h2>
          <ol>
            {article.sections.map((s) => (
              <li key={s.id}>
                <a href={`${articleHref(article.id)}/${s.number}`}>
                  {s.number} {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {article.sections.map(renderSection)}

      {article.related.length > 0 && (
        <section className="wiki-related" aria-labelledby="wiki-related-title">
          <h2 id="wiki-related-title">Related articles</h2>
          <ul>
            {article.related.map((r) => (
              <li key={r.id}>
                <a href={articleHref(r.id)}>{r.title}</a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="wiki-footer">
        <span className="wiki-muted">Categories</span>{' '}
        {article.categories.map((c, i) => (
          <span key={c}>
            <a href={`#/wiki/Category:${encodeURIComponent(c)}`}>{c}</a>
          </span>
        ))}
      </footer>
    </main>
  );
}
