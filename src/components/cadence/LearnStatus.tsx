import { useCadenceStore } from '../../stores/useCadenceStore';

export function LearnStatus() {
  const mode = useCadenceStore((s) => s.mode);
  const confidence = useCadenceStore((s) => s.confidenceScore);
  if (mode !== 'learn') return null;

  return (
    <div className="confidence-pill" title="How steady your taps are. Higher means a steadier pace.">
      <span>Steadiness</span>
      <div className="confidence-track">
        <div className="confidence-fill" style={{ width: `${confidence}%` }} />
      </div>
      <span>{confidence}%</span>
    </div>
  );
}
