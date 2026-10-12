import { DropPanel, DropHead } from './DropPanel';
import { usePrakaraStore } from '../stores/usePrakaraStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { SUKTA_MAP } from '../data';
import { PrakaraItem } from '../types/mantra';
import { transliterateVedic } from '../services/transliteration';
import { splitTitle } from '../services/titles';

interface PrakaraDetailsProps {
  isOpen: boolean;
  onClose: () => void;
}

function itemName(item: PrakaraItem): string {
  if (item.type === 'sukta_ref' && item.suktaId) {
    const sukta = SUKTA_MAP.get(item.suktaId);
    if (sukta) return `${sukta.title.sanskrit} (${sukta.title.english})`;
  }
  return item.customTitle ?? 'Vakya';
}

export function PrakaraDetails({ isOpen, onClose }: PrakaraDetailsProps) {
  const prakara = usePrakaraStore((s) => s.getActivePrakara());
  const lineCount = usePrakaraStore((s) => s.getFlattenedChunks().length);
  const script = useSettingsStore((s) => s.script);
  const title = splitTitle(prakara.title);

  return (
    <DropPanel label="Prakara details" isOpen={isOpen} onClose={onClose}>
      <DropHead title="Prakara" onClose={onClose} />

      <div className="details-body">
        <h2 className="details-title title-display">
          {transliterateVedic(title.sanskrit, script)}
          {title.english && <span className="details-english"> ({title.english})</span>}
        </h2>

        <dl className="details-meta">
          <dt>Created by</dt>
          <dd>{prakara.author ?? 'Unknown'}</dd>
          <dt>Lines</dt>
          <dd>{lineCount}</dd>
        </dl>

        <p className="details-desc">{prakara.description}</p>

        <h3 className="details-toc-title">Contents</h3>
        <ol className="details-toc">
          {prakara.items.map((item) => (
            <li key={item.id}>{transliterateVedic(itemName(item), script)}</li>
          ))}
        </ol>
      </div>
    </DropPanel>
  );
}
