/** A kriyā's note behind an asterisk; native disclosure, so it opens by tap or keyboard with no script. */
export function KriyaNote({ note }: { note?: string }) {
  if (!note) return null;
  return (
    <details className="kriya-note" onClick={(e) => e.stopPropagation()}>
      <summary aria-label="Note on this kriyā">*</summary>
      <p>{note}</p>
    </details>
  );
}
