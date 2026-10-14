import { Fragment } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { ALL_SUKTAMS } from '../data';
import { getArticle } from '../services/wiki';
import { buildRows, type WikiRow } from '../services/wikiRows';
import { useSettingsStore } from '../stores/useSettingsStore';
import { HOME_HASH, categoryHash, nirdesaHash, routeRangeOk, type Route } from '../services/wikiNav';
import { type Pos, parseNirdesa, rangeWords, selectionNirdesa } from '../services/nirdesa';
import { mixedTitle } from '../services/titles';
import { basketToPrakara } from '../services/basket';
import { usePrakaraStore } from '../stores/usePrakaraStore';
import { useRecentStore } from '../stores/useRecentStore';
import { Icon } from './Icon';
import { ArticleTitle, useTitleText, ArticleSubtitle, useCiteInWords } from './Sanskrit';
import { SourceList } from './SourceList';
import { Contents } from './WikiContents';
import { WikiInfo } from './WikiInfo';
import { WikiHeadingRow, WikiLineRow, WikiRangeRow } from './WikiRows';
import { useArticleWindow } from '../hooks/useArticleWindow';

/** Where a reader creates an article that does not exist yet. */
// ponytail: placeholder until the repository URL is confirmed; set it to the real repo's new-file page.
const NEW_ARTICLE_URL = 'https://github.com/sushruth/prakaram/new/main/src/data';

const cmp = (a: Pos, b: Pos) => a.section - b.section || a.pada - b.pada;

/** A selection of padas: the tapped start, and the end once a second number is tapped. Where padyas exist it covers whole padyas unless refined to padas. */
interface Sel {
  a: Pos;
  b?: Pos;
}

interface WikiArticleProps {
  id: string;
  /** Section number to bring into view, from the `#/wiki/<id>/<n>` address. */
  section?: number;
  /** Padas to mark and scroll to, from `#/wiki/<id>/<s>.<from>-<to>`. */
  range?: Extract<Route, { kind: 'article' }>['range'];
  /** Play a nirdeśa in the player: an article id, a section's piece id or a range. */
  onRun: (pieceId: string) => void;
}

/** A Wikipedia-style article about one piece of the corpus: lead, infobox, contents and sections of text. */
export function WikiArticle({ id, section, range, onRun }: WikiArticleProps) {
  // The padas picked by tapping the numbers: a start, then optionally an end. A deep link starts with its range.
  // A linked range is used only when its full address resolves (in range, not reversed); otherwise nothing is selected.
  const rangeOk = routeRangeOk(id, range);
  const doc = ALL_SUKTAMS.find((d) => d.id === id);
  const fromRoute = (): Sel | undefined => (range && rangeOk ? { a: range.from, ...(cmp(range.from, range.to) ? { b: range.to } : {}) } : undefined);
  // A linked range that does not line up with whole padyas starts refined to padas.
  const refinedRoute = () => {
    const r = range && rangeOk && doc ? selectionNirdesa(doc, range.from, range.to) : undefined;
    return !!r && (cmp(r.lo, range!.from) !== 0 || cmp(r.hi, range!.to) !== 0);
  };
  const [sel, setSel] = useState<Sel | undefined>(fromRoute);
  const [byPada, setByPada] = useState(refinedRoute);
  const [copied, setCopied] = useState(false);
  const cite = useCiteInWords();
  const titleText = useTitleText();
  const fontSize = useSettingsStore((s) => s.fontSize);
  // The corpus is loaded before the article renders (App gates on the loader), so the article is stable across a scroll.
  const article = useMemo(() => getArticle(id), [id]);
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
    setSel(fromRoute());
    setByPada(refinedRoute());
    setCopied(false);
  }, [id, range?.from.section, range?.from.pada, range?.to.section, range?.to.pada, rangeOk]);

  // Remember the article the reader opened. Category, search and compose pages render other components, so
  // only real articles reach here; an unknown id is not recorded (getArticle returns undefined).
  const recordRecent = useRecentStore((s) => s.record);
  useEffect(() => {
    if (article) recordRecent(id);
  }, [id, article, recordRecent]);

  const own = article?.kind === 'source';
  const snap = sel && doc && own ? selectionNirdesa(doc, sel.a, sel.b ?? sel.a) : undefined;
  const span = sel && doc && own ? (byPada ? selectionNirdesa(doc, sel.a, sel.b ?? sel.a, true) : snap) : undefined;
  const hi = span?.hi;
  const rows = useMemo(() => (article ? buildRows(article, doc, own, hi) : []), [article, doc, own, hi?.section, hi?.pada, byPada]);
  const { listRef, start, end, top, bottom, measure, printing } = useArticleWindow({ rows, fontSize, id, section, from: range && rangeOk ? range.from : undefined });

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
  const lo = span?.lo;
  const picked = (p: Pos) => !!lo && !!hi && cmp(p, lo) >= 0 && cmp(p, hi) <= 0;
  const addr = span?.addr ?? '';
  const tap = (p: Pos) => {
    setCopied(false);
    const at = (x: Pos) => (doc ? selectionNirdesa(doc, x, x, byPada).lo : x);
    setSel((cur) => (!cur || cur.b ? { a: p } : cmp(at(cur.a), at(p)) === 0 ? undefined : { a: cur.a, b: p }));
  };
  const refine = () => {
    if (!byPada && span) setSel(cmp(span.lo, span.hi) ? { a: span.lo, b: span.hi } : { a: span.lo });
    setByPada(!byPada);
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}${location.pathname}${location.search}${nirdesaHash(addr)}`);
      setCopied(true);
    } catch {
      /* clipboard blocked: the address bar still holds the link after Follow */
    }
  };
  const words = addr ? rangeWords(parseNirdesa(addr)!) : '';

  // ponytail: a composed work has no piece of its own, so Follow saves it as a prakara first.
  const followAll = () => {
    if (article.kind !== 'composition') return onRun(id);
    const store = usePrakaraStore.getState();
    if (store.prakaras.some((p) => p.id === id)) store.selectPrakara(id);
    else store.addPrakara(basketToPrakara(article.sections.map((x) => x.pieceId), mixedTitle(article.title)));
    window.location.hash = '';
  };

  const citeText = doc && addr ? cite(doc, addr) : undefined;
  const mounted = start <= end ? rows.slice(start, end + 1).map((row, i) => ({ row, index: start + i })) : [];
  const renderRow = (row: WikiRow, index: number) => {
    const rowRef = measure(index);
    switch (row.type) {
      case 'heading':
        return <WikiHeadingRow row={row} sectionCount={article.sections.length} composition={article.kind === 'composition'} editUrl={article.editUrl} onRun={onRun} rowRef={rowRef} />;
      case 'line':
        return <WikiLineRow row={row} fontSize={fontSize} picked={picked} tap={tap} rowRef={rowRef} />;
      case 'range':
        return <WikiRangeRow citeText={citeText} addr={addr} words={words} onRun={onRun} copied={copied} onCopy={copyLink} showRefine={!!snap?.padya} byPada={byPada} onRefine={refine} onClear={() => setSel(undefined)} rowRef={rowRef} />;
      case 'missing':
        return <p className="wiki-muted" ref={rowRef}>The text of this section is not available.</p>;
    }
  };

  const followLabel = article.kind === 'composition' ? 'Follow this composition' : 'Follow';
  const parent = article.veda ?? (article.kind === 'composition' ? 'Compositions' : 'Sources');

  return (
    <main className="wiki-article">
      <nav aria-label="Breadcrumb" className="wiki-crumbs">
        <a href={HOME_HASH}>Koshah</a> › <a href={categoryHash(parent)}>{parent}</a> › <span aria-current="page"><ArticleTitle title={article.title} /></span>
      </nav>

      <div className="wiki-titlerow">
        <h1 className="wiki-title vedic-text">
          <ArticleTitle title={article.title} />
        </h1>
        {own && article.sections.length > 1 && <Contents id={article.id} doc={doc} sections={article.sections} onRun={onRun} />}
        <button type="button" className="icon-btn wiki-follow" onClick={followAll} aria-label={followLabel} title={followLabel}>
          <Icon name="play" size={22} />
        </button>
      </div>
      <ArticleSubtitle title={article.title} />
      {doc?.metadata.place && own && <p className="wiki-cite wiki-muted">{cite(doc, section === undefined ? id : `${id}/${section}`)}</p>}
      {!rangeOk && <p className="wiki-muted" role="note">That range is not in this text.</p>}

      {article.sources.length > 0 && (
        <section className="wiki-sources" aria-labelledby="wiki-sources-title">
          <h2 id="wiki-sources-title" className="wiki-sources-title">Sources</h2>
          <SourceList sources={article.sources} />
        </section>
      )}

      <WikiInfo article={article} doc={doc} own={own} id={id} unconfirmed={unconfirmed} />

      {/* Only the section list is windowed: the chrome above stays mounted, the rows below move with the page scroll. */}
      <div className="wiki-sections" ref={listRef}>
        {!printing && top > 0 && <div className="wiki-spacer" style={{ height: `${top}px` }} aria-hidden="true" />}
        {mounted.map(({ row, index }) => (
          <Fragment key={row.key}>{renderRow(row, index)}</Fragment>
        ))}
        {!printing && bottom > 0 && <div className="wiki-spacer" style={{ height: `${bottom}px` }} aria-hidden="true" />}
      </div>
    </main>
  );
}
