import { minimap, MinimapCell } from '../services/minimap';
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

interface MinimapProps {
  chunks: MantraChunk[];
  index: number;
  duration: number;
  frozen: boolean;
  disabled: boolean;
  onToggle: () => void;
}

/** Previous, current and next line in miniature. The current line fills as you sing along; tapping pauses. */
export function Minimap({ chunks, index, duration, frozen, disabled, onToggle }: MinimapProps) {
  const rows = minimap([chunks[index - 1], chunks[index], chunks[index + 1]]);
  const label = frozen ? 'Resume auto progress' : 'Pause auto progress';
  return (
    <button className="minimap" onClick={onToggle} disabled={disabled} aria-pressed={frozen} data-frozen={frozen} aria-label={label} title={label}>
      <span className="minimap-lines" aria-hidden="true">
        {rows.map((row, i) => (
          <span key={i} className={`minimap-line ${row?.className ?? ''}`} data-now={i === 1}>
            {row && <Cells cells={row.cells} />}
            {i === 1 && row && (
              <span
                key={index}
                className="minimap-fill"
                style={{ animationDuration: `${duration}ms`, animationPlayState: frozen ? 'paused' : 'running' }}
              >
                <Cells cells={row.cells} />
              </span>
            )}
          </span>
        ))}
      </span>
      <svg className="minimap-pause" viewBox="0 0 20 20" aria-hidden="true">
        <rect x="5.5" y="4" width="3.4" height="12" rx="0.8" />
        <rect x="11.1" y="4" width="3.4" height="12" rx="0.8" />
      </svg>
    </button>
  );
}
