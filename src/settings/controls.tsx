import { FONT_SIZE, useSettingsStore } from '../stores/useSettingsStore';
import { THEMES } from '../config/themes';

export function Switch({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return <button className="switch" role="switch" aria-checked={checked} onClick={onToggle} />;
}

export function FontSizeStepper() {
  const fontSize = useSettingsStore((s) => s.fontSize);
  const setFontSize = useSettingsStore((s) => s.setFontSize);
  return (
    <div className="stepper">
      <button className="btn-icon" onClick={() => setFontSize(fontSize - 2)} aria-label="Decrease text size">
        A−
      </button>
      <span className="stepper-value">{fontSize}</span>
      <button className="btn-icon" onClick={() => setFontSize(fontSize + 2)} aria-label="Increase text size">
        A+
      </button>
    </div>
  );
}

export function WrapSwitch() {
  const checked = useSettingsStore((s) => s.wrapLines);
  const onToggle = useSettingsStore((s) => s.toggleWrapLines);
  return <Switch checked={checked} onToggle={onToggle} />;
}

export function SplitSwitch() {
  const checked = useSettingsStore((s) => s.splitLines);
  const onToggle = useSettingsStore((s) => s.toggleSplitLines);
  return <Switch checked={checked} onToggle={onToggle} />;
}

export function ThemeSegmented() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  return (
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
  );
}
