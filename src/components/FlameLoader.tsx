import { FlameMark } from './FlameMark';

/**
 * The indicator shown while a live source is fetched, so no screen is left half-built without a sign
 * that something is loading. The flame's own random walk (FlameMark) is the spinner; under
 * `prefers-reduced-motion` FlameMark leaves the flame still, so the quiet `Loading …` line carries the
 * meaning on its own. `label` names the source or work being loaded and is announced politely.
 */
export function FlameLoader({ label }: { label?: string }) {
  return (
    <div className="flame-loader" role="status" aria-live="polite">
      <FlameMark size={40} />
      <p className="flame-loader-label">{label ? `Loading ${label}…` : 'Loading…'}</p>
    </div>
  );
}
