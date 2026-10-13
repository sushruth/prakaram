// The one place Sanskrit/Vedic text becomes visible. Components never call the transliterator or
// renderVedic themselves: they use <Sanskrit>, <SanskritTitle>, <ArticleTitle> or useSanskritText(),
// all of which read the selected script from the settings store, so a script change re-renders everywhere.
import { useSettingsStore } from '../stores/useSettingsStore';
import { transliterateVedic } from '../services/transliteration';
import { displayTitle, splitTitle } from '../services/titles';
import { citeInWords } from '../services/cite';
import type { MantraDocument } from '../types/mantra';
import { renderVedic } from './renderVedic';

export const useScript = () => useSettingsStore((s) => s.script);

/** Plain-string form for attributes, aria-labels, document.title and messages. */
export function useSanskritText(): (text: string) => string {
  const script = useScript();
  return (text) => transliterateVedic(text, script);
}

/** Citation in words (see services/cite.ts) as plain text in the selected script; follows a script change. */
export function useCiteInWords(): (doc: MantraDocument, address: string) => string {
  const script = useScript();
  return (doc, address) => citeInWords(doc, address, script);
}

/** Title string ("Sanskrit (English)") as plain text in the selected script, for attributes. */
export function useTitleText(): (title: string, opts?: { short?: boolean; full?: boolean }) => string {
  const sk = useSanskritText();
  return (title, { short, full } = {}) => {
    const t = splitTitle(title);
    const s = sk(short ? displayTitle(title) : t.sanskrit);
    return full && t.english ? `${s} (${t.english})` : s;
  };
}

/** Devanagari source text in the selected script, swara syllables coloured. */
export function Sanskrit({ text }: { text: string }) {
  return <>{renderVedic(text, useScript())}</>;
}

/**
 * A mixed 'Sanskrit (English)' title: the Sanskrit in the selected script, the English untouched.
 * `short` truncates to the title akshara limit; `full` also shows the English part.
 */
export function SanskritTitle({ title, short, full }: { title: string; short?: boolean; full?: boolean }) {
  const t = splitTitle(title);
  return (
    <>
      <Sanskrit text={short ? displayTitle(title) : t.sanskrit} />
      {full && t.english && <span className="details-english"> ({t.english})</span>}
    </>
  );
}

/** An article/piece title object: the Sanskrit in the selected script, or the English when there is none. */
export function ArticleTitle({ title }: { title: { sanskrit: string; english: string } }) {
  return title.sanskrit ? <Sanskrit text={title.sanskrit} /> : <>{title.english}</>;
}

/** The English name under a Sanskrit title; nothing when the title is English only. */
export function ArticleSubtitle({ title }: { title: { sanskrit: string; english: string } }) {
  return title.sanskrit && title.english ? <p className="wiki-subtitle">{title.english}</p> : null;
}
