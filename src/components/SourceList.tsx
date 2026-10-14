import { articleHash } from '../services/wikiNav';
import { useCiteInWords } from './Sanskrit';
import type { ArticleSource } from '../services/wiki';

/** The revision or commit a live source is pinned to, read out of its upstream URL (Wikisource `oldid`, DharmicData blob). */
const pinnedRef = (url?: string): string | undefined => {
  if (!url) return undefined;
  const revid = url.match(/[?&]oldid=(\d+)/);
  if (revid) return `revid ${revid[1]}`;
  const commit = url.match(/\/blob\/([0-9a-f]{7,40})\//);
  if (commit) return `@${commit[1].slice(0, 7)}`;
  return undefined;
};

/**
 * The sources a page or prakaram reads, cited the same way in the wiki and the player: the work and its
 * place in words, the source it came from, its licence, and a link to the pinned upstream (or the article).
 */
export function SourceList({ sources }: { sources: ArticleSource[] }) {
  const cite = useCiteInWords();
  return (
    <ul className="source-list">
      {sources.map(({ doc, id }) => {
        const remote = doc.metadata.remoteUrl;
        const provenance = doc.metadata.provenance;
        const pin = pinnedRef(remote);
        return (
          <li key={id} className="source-item">
            <p className="source-work">
              <a href={remote ?? articleHash(id)} {...(remote ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {cite(doc, id)}
              </a>
              {provenance ? <span className="source-pin"> · {provenance.upstreamRef}</span> : pin && <span className="source-pin"> · {pin}</span>}
            </p>
            {provenance ? (
              <>
                <p className="source-provenance">{provenance.attribution}</p>
                <p className="source-provenance">retrieved {provenance.retrievedAt}</p>
                {provenance.license && <p className="source-license">{provenance.license}</p>}
              </>
            ) : (
              <>
                <p className="source-meta">{doc.metadata.source}</p>
                {doc.metadata.license && <p className="source-license">{doc.metadata.license}</p>}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
