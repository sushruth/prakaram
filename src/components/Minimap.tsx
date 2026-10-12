import { lineClass } from '../config/lineClass';
import { MantraChunk } from '../types/mantra';

// Each row is a real line drawn as its words: width follows the line's length, gaps fall between words.
function Words({ chunk }: { chunk: MantraChunk }) {
  const words = chunk.sanskrit.split(/\s+/).filter(Boolean);
  return (
    <span className="minimap-words">
      {words.map((w, i) => (
        <span key={i} style={{ flexGrow: w.length }} />
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
  const rows = [chunks[index - 1], chunks[index], chunks[index + 1]];
  const longest = Math.max(1, ...rows.map((c) => c?.sanskrit.length ?? 0));
  const label = frozen ? 'Resume auto progress' : 'Pause auto progress';
  return (
    <button className="minimap" onClick={onToggle} disabled={disabled} aria-pressed={frozen} data-frozen={frozen} aria-label={label} title={label}>
      <span className="minimap-lines" aria-hidden="true">
        {rows.map((c, i) => (
          <span key={i} className={`minimap-line ${c ? lineClass(c) : ''}`} data-now={i === 1} style={{ width: `${c ? (100 * c.sanskrit.length) / longest : 0}%` }}>
            {c && <Words chunk={c} />}
            {i === 1 && c && (
              <span
                key={index}
                className="minimap-fill"
                style={{ animationDuration: `${duration}ms`, animationPlayState: frozen ? 'paused' : 'running' }}
              >
                <Words chunk={c} />
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
