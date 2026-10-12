import { hasSwara } from '../services/swara';
import { sourcePieces } from '../services/swaraSegments';
import { transliterateVedic } from '../services/transliteration';
import { TargetScript } from '../types/mantra';

/** Devanagari source as the reader shows it: transliterated to the chosen script, swara syllables coloured. */
export function renderVedic(raw: string, script: TargetScript) {
  // Non-breaking spaces keep a danda with the word before it and with its verse number.
  const sanskrit = raw.replace(/ ([।॥])/g, ' $1').replace(/([।॥]) (\d)/g, '$1 $2');
  if (!hasSwara(sanskrit)) return transliterateVedic(sanskrit, script);
  return sourcePieces(sanskrit).map((piece, i) =>
    piece.tone ? (
      <span key={i} className={`swara-${piece.tone}`}>
        {transliterateVedic(piece.text, script)}
      </span>
    ) : (
      transliterateVedic(piece.text, script)
    ),
  );
}
