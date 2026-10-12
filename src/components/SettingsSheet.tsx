import { DropPanel, DropHead } from './DropPanel';
import { SETTINGS } from '../settings/registry';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsSheet({ isOpen, onClose }: SettingsSheetProps) {
  return (
    <DropPanel label="Settings" isOpen={isOpen} onClose={onClose}>
      <DropHead title="Settings" onClose={onClose} />
      {SETTINGS.map(({ id, label, Control }) => (
        <div className="settings-row" key={id}>
          <span className="settings-label">{label}</span>
          <Control />
        </div>
      ))}
      <a className="settings-source" href="https://github.com/sushruth/prakaram" target="_blank" rel="noopener noreferrer">
        Source on GitHub
      </a>
    </DropPanel>
  );
}
