import { useState } from 'preact/hooks';
import { usePrakaraStore } from '../stores/usePrakaraStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { ALL_SUKTAMS } from '../data';
import { Prakara, PrakaraItem } from '../types/mantra';
import { encodePrakaraToUrlHash } from '../services/urlCodec';
import { ModalFrame } from './ModalFrame';
import { PrakaraList } from './PrakaraList';
import { PrakaraComposer } from './PrakaraComposer';

interface PrakaraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const newItemId = () => 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);

export function PrakaraBuilderModal({ isOpen, onClose }: PrakaraModalProps) {
  const { prakaras, activePrakaraId, selectPrakara, addPrakara } = usePrakaraStore();
  const targetScript = useSettingsStore((s) => s.script);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [selectedItems, setSelectedItems] = useState<PrakaraItem[]>([]);
  const [customVakyaText, setCustomVakyaText] = useState('');
  const [customVakyaTitle, setCustomVakyaTitle] = useState('');
  const [shareMsg, setShareMsg] = useState('');

  const handleAddSukta = (suktaId: string) => {
    const sukta = ALL_SUKTAMS.find((s) => s.id === suktaId);
    if (!sukta) return;
    const newItem: PrakaraItem = {
      id: newItemId(),
      type: 'sukta_ref',
      suktaId: sukta.id,
      customTitle: sukta.title.sanskrit + ' (' + sukta.title.english + ')',
    };
    setSelectedItems([...selectedItems, newItem]);
  };

  const handleAddVakya = () => {
    if (!customVakyaText.trim()) return;
    const newItem: PrakaraItem = {
      id: newItemId(),
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
      author: newAuthor.trim() || undefined,
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

  if (!isOpen) return null;

  return (
    <ModalFrame title={isCreatingNew ? 'Create New Prakara' : 'Prakara Sequence Studio'} onClose={onClose}>
      {shareMsg && (
        <div style={{ background: '#10b981', color: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
          {shareMsg}
        </div>
      )}

      {!isCreatingNew ? (
        <PrakaraList
          prakaras={prakaras}
          activePrakaraId={activePrakaraId}
          script={targetScript}
          onSelect={(id) => {
            selectPrakara(id);
            onClose();
          }}
          onShare={handleSharePrakara}
          onCompose={() => {
            setIsCreatingNew(true);
            setSelectedItems([]);
            setNewTitle('');
          }}
        />
      ) : (
        <PrakaraComposer
          script={targetScript}
          title={newTitle}
          onTitleChange={setNewTitle}
          author={newAuthor}
          onAuthorChange={setNewAuthor}
          description={newDesc}
          onDescriptionChange={setNewDesc}
          items={selectedItems}
          onRemoveItem={handleRemoveItem}
          onAddSukta={handleAddSukta}
          vakyaTitle={customVakyaTitle}
          onVakyaTitleChange={setCustomVakyaTitle}
          vakyaText={customVakyaText}
          onVakyaTextChange={setCustomVakyaText}
          onAddVakya={handleAddVakya}
          onSave={handleSavePrakara}
          onCancel={() => setIsCreatingNew(false)}
        />
      )}
    </ModalFrame>
  );
}
