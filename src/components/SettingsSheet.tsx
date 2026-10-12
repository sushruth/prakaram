import { useEffect } from 'preact/hooks';
import { Icon } from './Icon';
import { SETTINGS } from '../settings/registry';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsSheet({ isOpen, onClose }: SettingsSheetProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="settings-scrim" onClick={onClose} />
      <div className="settings-sheet" role="dialog" aria-label="Settings">
        <div className="settings-head">
          <span className="settings-title">Settings</span>
          <button className="btn-icon" onClick={onClose} aria-label="Close settings">
            <Icon name="x" size={16} />
          </button>
        </div>

        {SETTINGS.map(({ id, label, Control }) => (
          <div className="settings-row" key={id}>
            <span className="settings-label">{label}</span>
            <Control />
          </div>
        ))}
      </div>
    </>
  );
}
