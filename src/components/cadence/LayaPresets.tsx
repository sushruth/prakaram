import { LAYA_PRESETS, LayaType } from '../../types/cadence';
import { useCadenceStore } from '../../stores/useCadenceStore';

const PRESET_IDS: LayaType[] = ['dhyana', 'abhyasa', 'parayana'];
const NAMES: Record<LayaType, string> = {
  dhyana: 'Dhyāna',
  abhyasa: 'Abhyāsa',
  parayana: 'Pārāyaṇa',
  custom: 'Custom',
};

export function LayaPresets() {
  const laya = useCadenceStore((s) => s.laya);
  const setLayaPreset = useCadenceStore((s) => s.setLayaPreset);

  return (
    <div className="segmented" role="radiogroup" aria-label="Pace preset">
      {PRESET_IDS.map((id) => (
        <button
          key={id}
          role="radio"
          aria-checked={laya === id}
          className="segment"
          title={LAYA_PRESETS[id].description}
          onClick={() => setLayaPreset(id)}
        >
          {NAMES[id]}
        </button>
      ))}
    </div>
  );
}
