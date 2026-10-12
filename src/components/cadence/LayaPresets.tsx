import { LAYA_PRESETS, LayaType } from '../../types/cadence';
import { useCadenceStore } from '../../stores/useCadenceStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { transliterateVedic } from '../../services/transliteration';

const PRESET_IDS: LayaType[] = ['dhyana', 'abhyasa', 'parayana'];
const NAMES: Record<LayaType, string> = {
  dhyana: 'ध्यान',
  abhyasa: 'अभ्यास',
  parayana: 'पारायण',
  custom: 'स्वेच्छा',
};

export function LayaPresets() {
  const laya = useCadenceStore((s) => s.laya);
  const setLayaPreset = useCadenceStore((s) => s.setLayaPreset);
  const script = useSettingsStore((s) => s.script);

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
          {transliterateVedic(NAMES[id], script)}
        </button>
      ))}
    </div>
  );
}
