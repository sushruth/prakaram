import { Prakara } from '../types/mantra';
import { transliterateVedic } from '../services/transliteration';
import { Icon } from './Icon';

interface PrakaraListProps {
  prakaras: Prakara[];
  activePrakaraId: string;
  script: Parameters<typeof transliterateVedic>[1];
  onSelect: (id: string) => void;
  onShare: (prakara: Prakara) => void;
  onCompose: () => void;
}

export function PrakaraList({ prakaras, activePrakaraId, script, onSelect, onShare, onCompose }: PrakaraListProps) {
  return (
    <div>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Select a compiled sequence of Vedic mantras and procedures, or craft your own custom order:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {prakaras.map((p) => {
          const isSelected = p.id === activePrakaraId;
          return (
            <div
              key={p.id}
              onClick={() => onSelect(p.id)}
              style={{
                padding: '0.85rem 1.1rem',
                borderRadius: '10px',
                                background: isSelected ? 'var(--accent-light)' : 'var(--bg-card)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {transliterateVedic(p.title, script)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {p.description} ({p.items.length} sections)
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  className="icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(p);
                  }}
                  title="Share this Prakara"
                  style={{ width: '2rem', height: '2rem' }}
                >
                  <Icon name="link" size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        className="btn-primary"
        onClick={onCompose}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        + Compile New Prakara
      </button>
    </div>
  );
}
