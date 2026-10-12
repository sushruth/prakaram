import { PrakaraItem } from '../types/mantra';
import { ALL_SUKTAMS } from '../data';
import { transliterateVedic } from '../services/transliteration';
import { Icon } from './Icon';

const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' } as const;
const inputStyle = { width: '100%', padding: '0.55rem', borderRadius: '8px', background: 'var(--bg-card)' } as const;

interface PrakaraComposerProps {
  script: Parameters<typeof transliterateVedic>[1];
  title: string;
  onTitleChange: (v: string) => void;
  author: string;
  onAuthorChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  items: PrakaraItem[];
  onRemoveItem: (index: number) => void;
  onAddSukta: (suktaId: string) => void;
  vakyaTitle: string;
  onVakyaTitleChange: (v: string) => void;
  vakyaText: string;
  onVakyaTextChange: (v: string) => void;
  onAddVakya: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function PrakaraComposer(props: PrakaraComposerProps) {
  const { script, items } = props;
  const canSave = !!props.title.trim() && items.length > 0;

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Prakara Title</label>
        <input
          type="text"
          placeholder="e.g. Navaratri Chanting Combo"
          value={props.title}
          onChange={(e) => props.onTitleChange((e.target as HTMLInputElement).value)}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Your name (optional)</label>
        <input
          type="text"
          placeholder="Shown as the creator"
          value={props.author}
          onChange={(e) => props.onAuthorChange((e.target as HTMLInputElement).value)}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Description</label>
        <input
          type="text"
          placeholder="e.g. Purushasuktam then Durgasuktam with Dhyanam"
          value={props.description}
          onChange={(e) => props.onDescriptionChange((e.target as HTMLInputElement).value)}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: '1.2rem' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>
          Sequence Order ({items.length} items)
        </label>
        {items.length === 0 ? (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
            No items added yet. Choose a Suktam or add a custom Vakya below.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {items.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  padding: '0.45rem 0.75rem',
                  background: 'var(--bg-card)',
                  
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                }}
              >
                <span>
                  <strong>{idx + 1}.</strong> {transliterateVedic(item.customTitle ?? '', script)}
                </span>
                <button
                  onClick={() => props.onRemoveItem(idx)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '1.2rem' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>
          + Add Suktam to Sequence
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {ALL_SUKTAMS.map((s) => (
            <button
              key={s.id}
              onClick={() => props.onAddSukta(s.id)}
              style={{
                padding: '0.35rem 0.7rem',
                borderRadius: '999px',
                
                background: 'var(--bg-card)',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              + {transliterateVedic(s.title.sanskrit, script)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem', padding: '0.85rem', background: 'var(--bg-card)', borderRadius: '8px', }}>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>
          + Insert Custom Vakya / Sankalpam / Procedure
        </label>
        <input
          type="text"
          placeholder="Vakya Title (e.g. Sankalpam / Dhyanam)"
          value={props.vakyaTitle}
          onChange={(e) => props.onVakyaTitleChange((e.target as HTMLInputElement).value)}
          style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', marginBottom: '0.4rem', fontSize: '0.82rem' }}
        />
        <textarea
          placeholder="Sanskrit Vakya or instruction text..."
          value={props.vakyaText}
          onChange={(e) => props.onVakyaTextChange((e.target as HTMLTextAreaElement).value)}
          rows={2}
          style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '0.4rem' }}
        />
        <button className="btn-primary" onClick={props.onAddVakya} style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem' }}>
          + Add Vakya to Sequence
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem' }}>
        <button
          className="btn-primary"
          onClick={props.onSave}
          disabled={!canSave}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          Save & Start Chanting
        </button>
        <button
          onClick={props.onCancel}
          style={{ padding: '0.55rem 1rem', borderRadius: '999px', background: 'var(--bg-card)', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
