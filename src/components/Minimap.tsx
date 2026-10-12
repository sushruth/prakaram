import { useEffect, useMemo, useState } from 'preact/hooks';
import { measureLines } from '../services/lineBreaks';
import { minimap, MinimapCell } from '../services/minimap';
import { useSettingsStore } from '../stores/useSettingsStore';
import { MantraChunk } from '../types/mantra';

function Cells({ cells }: { cells: MinimapCell[] }) {
  return (
    <span className="minimap-cells">
      {cells.map((c, i) => (
        <span key={i} className={c.tone ? `swara-${c.tone}` : undefined} data-blank={c.blank} />
      ))}
    </span>
  );
}

/** How the reader wrapped the previous, current and next line. Re-measured when the line, font, script or width changes. */
function useBreaks(index: number): (number[] | undefined)[] {
  const fontSize = useSettingsStore((s) => s.fontSize);
  const script = useSettingsStore((s) => s.script);
  const [breaks, setBreaks] = useState<(number[] | undefined)[]>([]);
  useEffect(() => {
    const measure = () => {
      const els = document.querySelectorAll('.chunk-row .vedic-text');
      const next = [-1, 0, 1].map((d) => (els[index + d] ? measureLines(els[index + d]) : undefined));
      setBreaks((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    // The reader renders after the strip, so wait a frame for its DOM to settle.
    const raf = requestAnimationFrame(measure);
    document.fonts?.ready.then(measure);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
    };
  }, [index, fontSize, script]);
  return breaks;
}

interface MinimapProps {
  chunks: MantraChunk[];
  index: number;
  duration: number;
  frozen: boolean;
  disabled: boolean;
  onToggle: () => void;
}

/** Previous, current and next line in miniature, wrapped as on the page. The current line fills as you sing along; tapping pauses. */
export function Minimap({ chunks, index, duration, frozen, disabled, onToggle }: MinimapProps) {
  const breaks = useBreaks(index);
  const rows = useMemo(() => minimap([chunks[index - 1], chunks[index], chunks[index + 1]], breaks), [chunks, index, breaks]);
  const label = frozen ? 'Resume auto progress' : 'Pause auto progress';
  return (
    <button className="minimap" onClick={onToggle} disabled={disabled} aria-pressed={frozen} data-frozen={frozen} aria-label={label} title={label}>
      <span className="minimap-lines" aria-hidden="true">
        {rows.map((row, i) => {
          const now = i === 1;
          const total = row?.lines.reduce((n, l) => n + l.length, 0) ?? 1;
          let before = 0;
          return (
            <span
              key={now ? `now-${index}` : i}
              className={`minimap-row ${row?.className ?? ''}`}
              data-now={now}
              style={now ? { animationDuration: `${duration}ms`, animationPlayState: frozen ? 'paused' : 'running' } : undefined}
            >
              {row?.lines.map((cells, j) => {
                // Each screen line covers its own slice of the sing-along: it starts at --from and runs --scale times faster.
                const style = { '--from': `${(100 * before) / total}%`, '--scale': total / cells.length };
                before += cells.length;
                return (
                  <span key={j} className="minimap-line" style={style}>
                    <Cells cells={cells} />
                  </span>
                );
              })}
            </span>
          );
        })}
      </span>
      <svg className="minimap-pause" viewBox="0 0 20 20" aria-hidden="true">
        <rect x="5.5" y="4" width="3.4" height="12" rx="0.8" />
        <rect x="11.1" y="4" width="3.4" height="12" rx="0.8" />
      </svg>
    </button>
  );
}
