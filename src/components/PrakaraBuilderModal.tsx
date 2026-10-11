import { useState } from 'preact/hooks';
import { usePrakaraStore } from '../stores/usePrakaraStore';
import { ALL_SUKTAMS } from '../data';
import { Prakara, PrakaraItem } from '../types/mantra';
import { encodePrakaraToUrlHash } from '../services/urlCodec';

interface PrakaraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrakaraBuilderModal({ isOpen, onClose }: PrakaraModalProps) {
  if (!isOpen) return null;

  const { prakaras, activePrakaraId, selectPrakara, addPrakara } = usePrakaraStore();
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedItems, setSelectedItems] = useState<PrakaraItem[]>([]);
  const [customVakyaText, setCustomVakyaText] = useState('');
  const [customVakyaTitle, setCustomVakyaTitle] = useState('');
  const [shareMsg, setShareMsg] = useState('');

  const handleAddSukta = (suktaId: string) => {
    const sukta = ALL_SUKTAMS.find((s) => s.id === suktaId);
    if (!sukta) return;
    const newItem: PrakaraItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      type: 'sukta_ref',
      suktaId: sukta.id,
      customTitle: sukta.title.sanskrit + ' (' + sukta.title.english + ')',
    };
    setSelectedItems([...selectedItems, newItem]);
  };

  const handleAddVakya = () => {
    if (!customVakyaText.trim()) return;
    const newItem: PrakaraItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      type: 'vakya',
      customTitle: customVakyaTitle.trim() || 'Custom Vakya',
      customText: customVakyaText.trim(),
    };
    setSelectedItems([...selectedItems, newItem]);
    setCustomVakyaText('');
    setCustomVakyaTitle('');
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleSavePrakara = () => {
    if (!newTitle.trim() || selectedItems.length === 0) return;
    const newPrakara: Prakara = {
      id: 'custom-prakara-' + Date.now(),
      title: newTitle.trim(),
      description: newDesc.trim() || 'Custom Vedic Sequence',
      preferredBpm: 72,
      createdTimestamp: Date.now(),
      items: selectedItems,
    };
    addPrakara(newPrakara);
    setIsCreatingNew(false);
    onClose();
  };

  const handleSharePrakara = async (prakara: Prakara) => {
    const hash = await encodePrakaraToUrlHash(prakara);
    const url = `${window.location.origin}${window.location.pathname}#p=${hash}`;
    await navigator.clipboard.writeText(url);
    setShareMsg(`Copied link for "${prakara.title}"!`);
    setTimeout(() => setShareMsg(''), 3000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <h3 className="title-serif" style={{ fontSize: '1.25rem', margin: 0, color: 'var(--accent)' }}>
            {isCreatingNew ? 'Create New Prakara' : 'Prakara Sequence Studio'}
          </h3>
          <button className="btn-icon" onClick={onClose} style={{ width: '2rem', height: '2rem' }}>
            ✕
          </button>
        </div>

        {shareMsg && (
          <div style={{ background: '#10b981', color: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {shareMsg}
          </div>
        )}

        {!isCreatingNew ? (
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
                    onClick={() => {
                      selectPrakara(p.id);
                      onClose();
                    }}
                    style={{
                      padding: '0.85rem 1.1rem',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                      background: isSelected ? 'var(--highlight-bg)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {p.description} ({p.items.length} sections)
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSharePrakara(p);
                        }}
                        title="Share this Prakara"
                        style={{ width: '2rem', height: '2rem' }}
                      >
                        🔗
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              className="btn-primary"
              onClick={() => {
                setIsCreatingNew(true);
                setSelectedItems([]);
                setNewTitle('');
              }}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              + Compile New Prakara
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Prakara Title
              </label>
              <input
                type="text"
                placeholder="e.g. Navaratri Chanting Combo"
                value={newTitle}
                onChange={(e) => setNewTitle((e.target as HTMLInputElement).value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Description
              </label>
              <input
                type="text"
                placeholder="e.g. Purushasuktam then Durgasuktam with Dhyanam"
                value={newDesc}
                onChange={(e) => setNewDesc((e.target as HTMLInputElement).value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}
              />
            </div>

            {/* Current Sequence List */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Sequence Order ({selectedItems.length} items)
              </label>
              {selectedItems.length === 0 ? (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                  No items added yet. Choose a Suktam or add a custom Vakya below.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {selectedItems.map((item, idx) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '0.45rem 0.75rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.85rem',
                      }}
                    >
                      <span>
                        <strong>{idx + 1}.</strong> {item.customTitle}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Suktam Section */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                + Add Suktam to Sequence
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {ALL_SUKTAMS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleAddSukta(s.id)}
                    style={{
                      padding: '0.35rem 0.7rem',
                      borderRadius: '999px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-card)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                    }}
                  >
                    + {s.title.sanskrit}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Custom Vakya Section */}
            <div style={{ marginBottom: '1.5rem', padding: '0.85rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                + Insert Custom Vakya / Sankalpam / Procedure
              </label>
              <input
                type="text"
                placeholder="Vakya Title (e.g. Sankalpam / Dhyanam)"
                value={customVakyaTitle}
                onChange={(e) => setCustomVakyaTitle((e.target as HTMLInputElement).value)}
                style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', marginBottom: '0.4rem', fontSize: '0.82rem' }}
              />
              <textarea
                placeholder="Sanskrit Vakya or instruction text..."
                value={customVakyaText}
                onChange={(e) => setCustomVakyaText((e.target as HTMLTextAreaElement).value)}
                rows={2}
                style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '0.82rem', marginBottom: '0.4rem' }}
              />
              <button
                className="btn-primary"
                onClick={handleAddVakya}
                style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem' }}
              >
                + Add Vakya to Sequence
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                className="btn-primary"
                onClick={handleSavePrakara}
                disabled={!newTitle.trim() || selectedItems.length === 0}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Save & Start Chanting
              </button>
              <button
                onClick={() => setIsCreatingNew(false)}
                style={{ padding: '0.55rem 1rem', border: '1px solid var(--border-subtle)', borderRadius: '999px', background: 'var(--bg-card)', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
