import { useEffect } from 'preact/hooks';
import { ALL_SUKTAMS } from '../data';
import { findPiece, pieceChunks } from '../services/koshah';
import { getArticle, type WikiArticle as Article, type WikiSection } from '../services/wiki';
import { lineClass } from '../config/lineClass';
import { useSettingsStore } from '../stores/useSettingsStore';
import { HOME_HASH, categoryHash } from '../services/wikiNav';
import { mixedTitle } from '../services/titles';
import { basketToPrakara } from '../services/basket';
import { usePrakaraStore } from '../stores/usePrakaraStore';
import { useBasketStore } from '../stores/useBasketStore';
import { Icon } from './Icon';
import { ArticleTitle, Sanskrit, useTitleText, ArticleSubtitle } from './Sanskrit';

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

/** Text toggle: adds a piece to the basket, then reads "Added ✓ · remove". */
function AddToPrakaram({ pieceIds }: { pieceIds: string[] }) {
  const added = useBasketStore((s) => pieceIds.length > 0 && pieceIds.every((p) => s.items.some((i) => i.pieceId === p)));
  const { add, remove } = useBasketStore.getState();
  return added ? (
    <button type="button" className="wiki-link wiki-add" data-added onClick={() => pieceIds.forEach(remove)}>
      Added ✓ · remove
    </button>
  ) : (
    <button type="button" className="wiki-link wiki-add" onClick={() => pieceIds.forEach(add)}>
      Add to my prakaram
    </button>
  );
}

/** A Wikipedia-style article about one piece of the corpus: lead, infobox, contents and sections of text. */
export function WikiArticle({ id, section, onRun }: WikiArticleProps) {
  const titleText = useTitleText();
  const fontSize = useSettingsStore((s) => s.fontSize);
  const article = getArticle(id);
  const pageTitle = article ? titleText(mixedTitle(article.title)) : '';

  useEffect(() => {
    if (!pageTitle) return;
    const previous = document.title;
    document.title = pageTitle;
    return () => {
      document.title = previous;
    };
  }, [pageTitle]);

  useEffect(() => {
    if (section === undefined) return;
    const target = document.getElementById(sectionDomId(section));
    target?.scrollIntoView({ block: 'start' });
    target?.focus({ preventScroll: true });
  }, [id, section]);

  // ponytail: a composed work has no piece of its own, so Follow saves it as a prakara first.
  const followAll = () => {
    if (!article || article.kind !== 'composition') return onRun(id);
    const store = usePrakaraStore.getState();
    if (store.prakaras.some((p) => p.id === id)) store.selectPrakara(id);
    else store.addPrakara(basketToPrakara(article.sections.map((x) => ({ pieceId: x.pieceId })), mixedTitle(article.title)));
    window.location.hash = '';
  };

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
          {s.from && (
            <span className="wiki-from"> from <a href={`${articleHref(s.from.id)}/${s.from.number}`}><ArticleTitle title={{ sanskrit: s.from.sanskrit, english: s.from.title }} /></a> §{s.from.number}</span>
          )}
          <span className="wiki-section-actions">
            <button type="button" className="wiki-link" onClick={() => onRun(s.pieceId)}>
              [follow]
            </button>
            {(article.sections.length > 1 || article.kind === 'composition') && <AddToPrakaram pieceIds={[s.pieceId]} />}
            <a href={article.editUrl}>[edit]</a>
          </span>
        </h2>
        {piece ? (
          pieceChunks(ALL_SUKTAMS, piece).map((chunk, i) => (
            <p key={`${chunk.id}-${i}`} className={`wiki-line vedic-text ${lineClass(chunk)}`} style={{ fontSize: `${fontSize}px` }}>
              <Sanskrit text={chunk.sanskrit} />
            </p>
          ))
        ) : (
          <p className="wiki-muted">The text of this section is not available.</p>
        )}
      </section>
    );
  };

  const followLabel = article.kind === 'composition' ? 'Follow this composition' : 'Follow';
  const parent = article.veda ?? (article.kind === 'composition' ? 'Compositions' : 'Sources');
  const peek = [article.veda, article.deity, `${article.lines} lines`].filter(Boolean).join(' · ');
  const ref = (r: { id: string; title: string; sanskrit: string }) => (
    <li key={r.id}>
      <a href={articleHref(r.id)}>
        <ArticleTitle title={{ sanskrit: r.sanskrit, english: r.title }} />
      </a>
    </li>
  );

  return (
    <main className="wiki-article">
      <nav aria-label="Breadcrumb" className="wiki-crumbs">
        <a href={HOME_HASH}>Koshah</a> › <a href={categoryHash(parent)}>{parent}</a> › <span aria-current="page"><ArticleTitle title={article.title} /></span>
      </nav>

      <div className="wiki-titlerow">
        <h1 className="wiki-title vedic-text">
          <ArticleTitle title={article.title} />
        </h1>
        <button type="button" className="icon-btn wiki-follow" onClick={followAll} aria-label={followLabel} title={followLabel}>
          <Icon name="play" size={22} />
        </button>
      </div>
      <ArticleSubtitle title={article.title} />

      <details className="wiki-info">
        <summary>
          Info <span className="wiki-muted">{peek}</span>
          {unconfirmed && <span className="wiki-notice-word"> · {STATUS_LABEL[article.status]}</span>}
        </summary>

        {unconfirmed && (
          <p className="wiki-notice" role="note">
            <span className="wiki-notice-word">{STATUS_LABEL[article.status]}.</span> This text has not been proofread / permission pending.
          </p>
        )}

        <p className="wiki-lead">{article.summary}</p>

        <dl className="wiki-facts">
          {article.veda && (<><dt>Veda</dt><dd>{article.veda}</dd></>)}
          {article.deity && (<><dt>Deity</dt><dd>{article.deity}</dd></>)}
          {article.usage && (<><dt>Usage</dt><dd>{article.usage}</dd></>)}
          <dt>Source</dt>
          <dd>{article.source}</dd>
          <dt>Status</dt>
          <dd>
            <span className="wiki-status" data-status={article.status}>{STATUS_LABEL[article.status]}</span>
          </dd>
          <dt>Licence</dt>
          <dd>{article.license ?? 'Not stated'}</dd>
          <dt>Lines</dt>
          <dd>{article.lines}</dd>
        </dl>

        <section className="wiki-brings" aria-labelledby="wiki-brings-title">
          <h2 id="wiki-brings-title">Brings</h2>
          <ul>
            {article.media.map((m, i) => (
              <li key={i}>
                <span className="wiki-brings-kind">{m.label ?? m.kind}</span>
                {[
                  m.language,
                  m.script,
                  m.swara === undefined ? undefined : m.swara ? 'with swara' : 'no swara',
                  m.count === undefined ? undefined : `${m.count} lines`,
                  m.source,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </li>
            ))}
          </ul>
        </section>

        {article.usedIn.length > 0 && (
          <section className="wiki-related" aria-labelledby="wiki-used-title">
            <h2 id="wiki-used-title">Used in</h2>
            <ul>{article.usedIn.map(ref)}</ul>
          </section>
        )}

        {article.related.length > 0 && (
          <section className="wiki-related" aria-labelledby="wiki-related-title">
            <h2 id="wiki-related-title">Related articles</h2>
            <ul>{article.related.map(ref)}</ul>
          </section>
        )}

        <p className="wiki-footer">
          <span className="wiki-muted">Categories</span>{' '}
          {article.categories.map((c) => (
            <a key={c} href={categoryHash(c)}>{c}</a>
          ))}
        </p>
        <p className="wiki-footer">
          <AddToPrakaram pieceIds={article.kind === 'composition' ? article.sections.map((x) => x.pieceId) : [article.id]} />
          <a href={article.editUrl}>Edit</a>
          <a href={article.historyUrl}>View history</a>
        </p>
      </details>

      {article.sections.map(renderSection)}
    </main>
  );
}
