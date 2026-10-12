import { TargetScript } from '../types/mantra';
import { useSettingsStore } from '../stores/useSettingsStore';
import { SCRIPTS } from '../services/transliteration';

export function ScriptSelector() {
  const script = useSettingsStore((s) => s.script);
  const setScript = useSettingsStore((s) => s.setScript);

  return (
    <div className="script-picker">
      <select
        value={script}
        onChange={(e) => setScript((e.target as HTMLSelectElement).value as TargetScript)}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '0.35rem 0.65rem',
          fontSize: '0.85rem',
          color: 'var(--text-primary)',
          cursor: 'pointer',
        }}
      >
        {SCRIPTS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.native} ({s.label})
          </option>
        ))}
      </select>
    </div>
  );
}
