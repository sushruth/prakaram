import { Icon } from './Icon';

/** A kriyā's note behind an info icon; native disclosure, so it opens by tap or keyboard with no script. */
export function KriyaNote({ note }: { note?: string }) {
  if (!note) return null;
  return (
    <details className="kriya-note" onClick={(e) => e.stopPropagation()}>
      <summary aria-label="Note on this kriyā" title="Note on this kriyā">
        <Icon name="info" size={18} />
      </summary>
      <p>{note}</p>
    </details>
  );
}
