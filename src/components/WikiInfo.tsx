import { Term } from './Term';
import { AddToPrakaram } from './WikiAdd';
import { ArticleTitle, useCiteInWords } from './Sanskrit';
import { articleHash, categoryHash } from '../services/wikiNav';
import type { ArticleRef, WikiArticle } from '../services/wiki';
import type { MantraDocument } from '../types/mantra';

const STATUS_LABEL = { draft: 'Draft', proofread: 'Proofread', reviewed: 'Reviewed' } as const;

const ref = (r: ArticleRef) => (
  <li key={r.id}>
    <a href={articleHash(r.id)}>
      <ArticleTitle title={{ sanskrit: r.sanskrit, english: r.title }} />
    </a>
  </li>
);

/** The Info disclosure: lead, facts, brings, used-in, related and footer. Native, closed by default, outside the window. */
export function WikiInfo({
  article,
  doc,
  own,
  id,
  unconfirmed,
}: {
  article: WikiArticle;
  doc?: MantraDocument;
  own: boolean;
  id: string;
  unconfirmed: boolean;
}) {
  const cite = useCiteInWords();
  const peek = [article.veda, article.deity, `${article.lines} padas`].filter(Boolean).join(' · ');
  return (
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
        {article.veda && (<><dt><Term id="veda">Veda</Term></dt><dd>{article.veda}</dd></>)}
        {article.deity && (<><dt>Deity</dt><dd>{article.deity}</dd></>)}
        {article.usage && (<><dt>Usage</dt><dd>{article.usage}</dd></>)}
        {doc?.metadata.place && own && (<><dt><Term id="nirdesha">Place</Term></dt><dd>{cite(doc, id)}</dd></>)}
        <dt>Status</dt>
        <dd>
          <span className="wiki-status" data-status={article.status}>{STATUS_LABEL[article.status]}</span>
        </dd>
        <dt><Term id="pada">Padas</Term></dt>
        <dd>{article.lines}</dd>
      </dl>

      <section className="wiki-brings" aria-labelledby="wiki-brings-title">
        <h2 id="wiki-brings-title"><Term id="samagri">Brings</Term></h2>
        <ul>
          {article.media.map((m, i) => (
            <li key={i}>
              <span className="wiki-brings-kind">{m.label ?? m.kind}</span>
              {[
                m.language,
                m.script,
                m.swara === undefined ? undefined : m.swara ? 'with swara' : 'no swara',
                m.count === undefined ? undefined : `${m.count} padas`,
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
  );
}
