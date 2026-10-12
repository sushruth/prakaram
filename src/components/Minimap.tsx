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

const WINDOW = [-2, -1, 0, 1, 2];
// Must match the row and line sizes in cadence.css (rem).
const LINE = 0.14;
const LINE_GAP = 0.03;
const ROW_GAP = 0.1;
const rowHeight = (lines: number) => (lines ? lines * LINE + (lines - 1) * LINE_GAP : 0);

/** How the reader wrapped the chunks around the current one. Re-measured when the line, font, script or width changes. */
function useBreaks(index: number): (number[] | undefined)[] {
  const fontSize = useSettingsStore((s) => s.fontSize);
  const script = useSettingsStore((s) => s.script);
  const [breaks, setBreaks] = useState<(number[] | undefined)[]>([]);
  useEffect(() => {
    const measure = () => {
      const els = document.querySelectorAll('.chunk-row .vedic-text');
      const next = WINDOW.map((d) => (els[index + d] ? measureLines(els[index + d]) : undefined));
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

/** The current line and its neighbours in miniature, wrapped as on the page. They scroll as the line changes. The current line fills as you sing along; tapping pauses. */
export function Minimap({ chunks, index, duration, frozen, disabled, onToggle }: MinimapProps) {
  const breaks = useBreaks(index);
  const rows = useMemo(() => minimap(WINDOW.map((d) => chunks[index + d]), breaks), [chunks, index, breaks]);
  // The track slides so the current row is centred. Rows keep their DOM node as the line changes, so this animates like the page scroll.
  const heights = rows.map((r) => rowHeight(r?.lines.length ?? 0));
  const before = heights.slice(0, 2).reduce((n, h) => n + h + ROW_GAP, 0);
  const shift = -(before + heights[2] / 2);
  const label = frozen ? 'Resume auto progress' : 'Pause auto progress';
  return (
    <button className="minimap" onClick={onToggle} disabled={disabled} aria-pressed={frozen} data-frozen={frozen} aria-label={label} title={label}>
      <span className="minimap-lines" aria-hidden="true">
        <span className="minimap-track" style={{ transform: `translateY(${shift}rem)` }}>
          {rows.map((row, i) => {
            if (!row) return null;
            const now = i === 2;
            const total = row.lines.reduce((n, l) => n + l.length, 0) || 1;
            let seen = 0;
            return (
              <span
                key={index + WINDOW[i]}
                className={`minimap-row ${row.className}`}
                data-now={now}
                data-far={Math.abs(i - 2) === 2}
                style={now ? { animationDuration: `${duration}ms`, animationPlayState: frozen ? 'paused' : 'running' } : undefined}
              >
                {row.lines.map((cells, j) => {
                  // Each screen line covers its own slice of the sing-along: it starts at --from and runs --scale times faster.
                  const style = { '--from': `${(100 * seen) / total}%`, '--scale': total / cells.length };
                  seen += cells.length;
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
      </span>
      <svg className="minimap-pause" viewBox="0 0 20 20" aria-hidden="true">
        <rect x="5.5" y="4" width="3.4" height="12" rx="0.8" />
        <rect x="11.1" y="4" width="3.4" height="12" rx="0.8" />
      </svg>
    </button>
  );
}
