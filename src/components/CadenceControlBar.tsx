import { useState } from 'preact/hooks';
import { useCadenceStore } from '../stores/useCadenceStore';
import { useMantraStore } from '../stores/useMantraStore';
import { usePrakaraStore } from '../stores/usePrakaraStore';
import { LAYA_PRESETS, LayaType } from '../types/cadence';
import { encodePrakaraToUrlHash } from '../services/urlCodec';

export function CadenceControlBar() {
  const {
    bpm,
    laya,
    setBpm,
    setLayaPreset,
    confidenceScore,
    canAutoProgress,
    isAutoProgress,
    toggleAutoProgress,
    registerTap,
    resetCadence,
  } = useCadenceStore();

  const { activeChunkIndex, nextChunk } = useMantraStore();
  const { getFlattenedChunks, getActivePrakara } = usePrakaraStore();

  const [copiedLink, setCopiedLink] = useState(false);
  const chunks = getFlattenedChunks();

  const handleTap = () => {
    const currentChunk = chunks[activeChunkIndex];
    if (currentChunk) {
      registerTap(currentChunk.id, currentChunk.sanskrit);
    }
    nextChunk(chunks.length);
  };

  const handleShare = async () => {
    const prakara = getActivePrakara();
    prakara.preferredBpm = bpm;
    const hash = await encodePrakaraToUrlHash(prakara);
    const url = `${window.location.origin}${window.location.pathname}#p=${hash}`;
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="bottom-bar">
      {/* Laya & BPM Preset Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {(['dhyana', 'abhyasa', 'parayana'] as LayaType[]).map((key) => {
          const preset = LAYA_PRESETS[key];
          const isSelected = laya === key;
          return (
            <button
              key={key}
              onClick={() => setLayaPreset(key)}
              style={{
                background: isSelected ? 'var(--accent)' : 'var(--bg-card)',
                color: isSelected ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '9999px',
                padding: '0.25rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title={preset.description}
            >
              {preset.name === 'dhyana' ? 'Dhyāna' : preset.name === 'abhyasa' ? 'Abhyāsa' : 'Pārāyaṇa'}
            </button>
          );
        })}
      </div>

      {/* BPM Slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '130px' }}>
        <input
          type="range"
          min="36"
          max="130"
          value={bpm}
          onChange={(e) => setBpm(Number((e.target as HTMLInputElement).value))}
          style={{ width: '80px', accentColor: 'var(--accent)', cursor: 'pointer' }}
          title={`Tempo: ${bpm} mātrās/min`}
        />
        <span style={{ fontSize: '0.8rem', fontWeight: 600, minWidth: '46px', color: 'var(--text-primary)' }}>
          {bpm} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BPM</span>
        </span>
      </div>

      {/* Tap Cadence Button */}
      <button
        className="btn-primary"
        onClick={handleTap}
        style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
        title="Tap or press Spacebar to record chanting rhythm"
      >
        <span>␣ Tap</span>
      </button>

      {/* Confidence Meter */}
      <div className="confidence-pill" title={`Cadence confidence: ${confidenceScore}%. Based on your rhythm consistency.`}>
        <div className="confidence-track">
          <div className="confidence-fill" style={{ width: `${confidenceScore}%` }} />
        </div>
        <span style={{ fontSize: '0.75rem' }}>{confidenceScore}%</span>
      </div>

      {/* Auto-Progress Toggle */}
      <button
        onClick={toggleAutoProgress}
        style={{
          background: isAutoProgress ? '#10b981' : canAutoProgress ? 'var(--accent-gold)' : 'var(--bg-card)',
          color: isAutoProgress || canAutoProgress ? '#fff' : 'var(--text-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '9999px',
          padding: '0.35rem 0.75rem',
          fontSize: '0.78rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          animation: canAutoProgress && !isAutoProgress ? 'pulse 1.8s infinite' : 'none',
        }}
        title={canAutoProgress ? 'Cadence recognized! Turn on Auto Progress' : 'Toggle automatic chanting progression'}
      >
        <span>{isAutoProgress ? '⏸ Auto' : '▶ Auto'}</span>
      </button>

      {/* Share / Copy Prakara Link */}
      <button
        className="btn-icon"
        onClick={handleShare}
        style={{ width: '2rem', height: '2rem' }}
        title="Share this Prakara & Cadence via compressed link"
      >
        {copiedLink ? '✓' : '🔗'}
      </button>

      {/* Reset Session */}
      <button
        className="btn-icon"
        onClick={resetCadence}
        style={{ width: '2rem', height: '2rem', fontSize: '0.75rem' }}
        title="Reset cadence learning session"
      >
        ↺
      </button>
    </div>
  );
}
