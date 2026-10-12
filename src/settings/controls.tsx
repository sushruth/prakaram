import { useMantraStore } from '../stores/useMantraStore';
import { useThemeStore } from '../stores/useThemeStore';
import { THEMES } from '../config/themes';

export function Switch({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return <button className="switch" role="switch" aria-checked={checked} onClick={onToggle} />;
}

export function FontSizeStepper() {
  const { fontSize, setFontSize } = useMantraStore();
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
  const { wrapLines, toggleWrapLines } = useMantraStore();
  return <Switch checked={wrapLines} onToggle={toggleWrapLines} />;
}

export function SplitSwitch() {
  const { splitLines, toggleSplitLines } = useMantraStore();
  return <Switch checked={splitLines} onToggle={toggleSplitLines} />;
}

export function ThemeSegmented() {
  const { theme, setTheme } = useThemeStore();
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
