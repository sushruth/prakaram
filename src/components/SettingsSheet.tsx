import { useEffect } from 'preact/hooks';
import { ScriptSelector } from './ScriptSelector';
import { useThemeStore, AppTheme } from '../stores/useThemeStore';
import { useMantraStore } from '../stores/useMantraStore';
import { Icon } from './Icon';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const THEMES: { id: AppTheme; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

// Bottom sheet on phones, flyout on wider screens (see .settings-sheet in theme.css).
export function SettingsSheet({ isOpen, onClose }: SettingsSheetProps) {
  const { theme, setTheme } = useThemeStore();
  const { fontSize, setFontSize, wrapLines, toggleWrapLines, splitLines, toggleSplitLines } = useMantraStore();

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

        <div className="settings-row">
          <span className="settings-label">Script</span>
          <ScriptSelector />
        </div>

        <div className="settings-row">
          <span className="settings-label">Text size</span>
          <div className="stepper">
            <button className="btn-icon" onClick={() => setFontSize(fontSize - 2)} aria-label="Decrease text size">
              A−
            </button>
            <span className="stepper-value">{fontSize}</span>
            <button className="btn-icon" onClick={() => setFontSize(fontSize + 2)} aria-label="Increase text size">
              A+
            </button>
          </div>
        </div>

        <div className="settings-row">
          <span className="settings-label">Wrap long lines</span>
          <button
            className="switch"
            role="switch"
            aria-checked={wrapLines}
            onClick={toggleWrapLines}
          />
        </div>

        <div className="settings-row">
          <span className="settings-label">Split into phrases</span>
          <button
            className="switch"
            role="switch"
            aria-checked={splitLines}
            onClick={toggleSplitLines}
          />
        </div>

        <div className="settings-row">
          <span className="settings-label">Theme</span>
          <div className="segmented" role="radiogroup" aria-label="Theme">
            {THEMES.map((t) => (
              <button
                key={t.id}
                role="radio"
                aria-checked={theme === t.id}
                className="segment"
                onClick={() => setTheme(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
