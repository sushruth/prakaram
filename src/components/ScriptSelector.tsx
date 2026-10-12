import { TargetScript } from '../types/mantra';
import { useMantraStore } from '../stores/useMantraStore';

const SCRIPTS: { id: TargetScript; label: string; native: string }[] = [
  { id: 'devanagari', label: 'Devanagari', native: 'संस्कृतम्' },
  { id: 'telugu', label: 'Telugu', native: 'తెలుగు' },
  { id: 'kannada', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { id: 'tamil', label: 'Tamil', native: 'தமிழ்' },
  { id: 'malayalam', label: 'Malayalam', native: 'മലയാളം' },
  { id: 'iast', label: 'IAST Roman', native: 'IAST' },
];

export function ScriptSelector() {
  const { targetScript, setScript } = useMantraStore();

  return (
    <div className="script-picker">
      <select
        value={targetScript}
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
