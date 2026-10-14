import { useEffect, useRef } from 'preact/hooks';

// Phosphor's flame outline with the flame gradient. Glow, sway, squash and the burst envelope are driven by a random walk (see useFlameNoise).
const OUTLINE =
  'M173.79,51.48a221.25,221.25,0,0,0-41.67-34.34,8,8,0,0,0-8.24,0A221.25,221.25,0,0,0,82.21,51.48C54.59,80.48,40,112.47,40,144a88,88,0,0,0,176,0C216,112.47,201.41,80.48,173.79,51.48ZM96,184c0-27.67,22.53-47.28,32-54.3,9.48,7,32,26.63,32,54.3a32,32,0,0,1-64,0Zm77.27,15.93A47.8,47.8,0,0,0,176,184c0-44-42.09-69.79-43.88-70.86a8,8,0,0,0-8.24,0C122.09,114.21,80,140,80,184a47.8,47.8,0,0,0,2.73,15.93A71.88,71.88,0,0,1,56,144c0-34.41,20.4-63.15,37.52-81.19A216.21,216.21,0,0,1,128,33.54a215.77,215.77,0,0,1,34.48,29.27C193.49,95.5,200,125,200,144A71.88,71.88,0,0,1,173.27,199.93Z';

type Channel = { v: number; target: number; next: number; range: [number, number] };

const CHANNELS: Record<'glow' | 'sway' | 'squash', Channel> = {
  glow: { v: 1, target: 1, next: 0, range: [0.5, 1.5] },
  sway: { v: 0, target: 0, next: 0, range: [-3, 3] },
  squash: { v: 1, target: 1, next: 0, range: [0.93, 1.06] },
};

// Burst tuning: a draft catching the flame. Every burst differs in when it starts, how long it
// lasts and how strong it is, so it never loops. Times are in milliseconds. The calm walk uses
// `calmInterval` and the base ranges; at full burst strength the targets are redrawn at
// `hotInterval`, the ranges widen by `spread` and the easing speeds up by `rush`.
export const BURST = {
  gap: [2600, 9000],
  length: [420, 1300],
  strength: [0.4, 1],
  calmInterval: [70, 380],
  hotInterval: [22, 90],
  spread: 1.9,
  rush: 2.2,
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** One-off burst envelope: peaks at `start`, decays linearly across `len`, and is 0 outside the span. */
export function burstStrength(now: number, start: number, len: number, peak: number): number {
  if (now < start || now >= start + len) return 0;
  return peak * (1 - (now - start) / len);
}

/** A channel's target range at the given burst strength: unchanged at rest, widened by BURST.spread at full burst. */
export function channelRange(range: [number, number], burst: number): [number, number] {
  const mid = (range[0] + range[1]) / 2;
  const half = ((range[1] - range[0]) / 2) * lerp(1, BURST.spread, burst);
  return [mid - half, mid + half];
}

// Each channel eases toward a random target, and the target is redrawn at a random interval,
// so the flicker never settles into a visible loop. Occasional bursts speed the walk up for a
// short, random span and then let it decay back to the calm walk. The channels and the burst
// envelope are set on the flame wrapper, so the glyph and the glow behind it share them.
// Reduced motion keeps the flame still.
//
// `ambient` marks the one flame that lights the room (the header logo): its walk is also written to
// :root, so the shell-level room light (App) reads the same flicker. Every other flame keeps the
// vars scoped to its own wrapper, so a second flame (the loader) cannot fight it.
function useFlameNoise(ref: { current: SVGSVGElement | null }, ambient = false) {
  useEffect(() => {
    const svg = ref.current;
    if (!svg || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Set on the wrapper (.header-flame) so the glow behind the glyph can read the channels too;
    // the svg inherits them for its own transform. An ambient flame writes to :root instead, and
    // the wrapper inherits them from there.
    const el = ambient ? document.documentElement : (svg.parentElement ?? svg);
    let raf = 0;
    let last = performance.now();
    let burstStart = 0;
    let burstLen = 1;
    let burstPeak = 0;
    let nextBurst = last + rand(BURST.gap[0], BURST.gap[1]);
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // A burst starts at a random time, lasts a random span and decays across it (one-off, never a loop).
      if (now >= nextBurst) {
        burstStart = now;
        burstLen = rand(BURST.length[0], BURST.length[1]);
        burstPeak = rand(BURST.strength[0], BURST.strength[1]);
        nextBurst = now + burstLen + rand(BURST.gap[0], BURST.gap[1]);
      }
      const burst = burstStrength(now, burstStart, burstLen, burstPeak);
      el.style.setProperty('--flame-burst', burst.toFixed(3));

      for (const [name, c] of Object.entries(CHANNELS)) {
        if (now >= c.next) {
          const [lo, hi] = channelRange(c.range, burst);
          c.target = rand(lo, hi);
          c.next = now + rand(
            lerp(BURST.calmInterval[0], BURST.hotInterval[0], burst),
            lerp(BURST.calmInterval[1], BURST.hotInterval[1], burst),
          );
        }
        c.v += (c.target - c.v) * Math.min(1, dt * rand(6, 20) * lerp(1, BURST.rush, burst));
        el.style.setProperty(`--flame-${name}`, c.v.toFixed(3));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref, ambient]);
}

export function FlameMark({ size = 22, ambient = false }: { size?: number; ambient?: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  useFlameNoise(ref, ambient);
  return (
    <svg ref={ref} className="flame-mark" width={size} height={size} viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="flame-body" gradientUnits="userSpaceOnUse" x1="0" y1="232" x2="0" y2="30">
          <stop offset="0" stopColor="#ffc83d" />
          <stop offset="0.55" stopColor="#ff7a1f" />
          <stop offset="1" stopColor="#e0331a" />
        </linearGradient>
        {/* The room-light halo, anchored to the glyph's own centre (128,128) so it is concentric by
            construction; colours come from CSS so the theme still drives it. */}
        <radialGradient id="flame-halo">
          <stop className="flame-halo-from" offset="0" />
          <stop className="flame-halo-mid" offset="0.45" />
          <stop className="flame-halo-to" offset="0.76" />
        </radialGradient>
      </defs>
      {/* Only the flame that lights the room (the header logo) carries the halo. */}
      {ambient && <circle className="flame-halo" cx="128" cy="128" r="512" fill="url(#flame-halo)" />}
      <path className="flame-body" fill="url(#flame-body)" d={OUTLINE} />
    </svg>
  );
}
