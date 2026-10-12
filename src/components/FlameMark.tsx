import { useEffect, useRef } from 'preact/hooks';

// Phosphor's flame outline with the flame gradient. Glow, sway and squash are driven by a random walk (see useFlameNoise).
const OUTLINE =
  'M173.79,51.48a221.25,221.25,0,0,0-41.67-34.34,8,8,0,0,0-8.24,0A221.25,221.25,0,0,0,82.21,51.48C54.59,80.48,40,112.47,40,144a88,88,0,0,0,176,0C216,112.47,201.41,80.48,173.79,51.48ZM96,184c0-27.67,22.53-47.28,32-54.3,9.48,7,32,26.63,32,54.3a32,32,0,0,1-64,0Zm77.27,15.93A47.8,47.8,0,0,0,176,184c0-44-42.09-69.79-43.88-70.86a8,8,0,0,0-8.24,0C122.09,114.21,80,140,80,184a47.8,47.8,0,0,0,2.73,15.93A71.88,71.88,0,0,1,56,144c0-34.41,20.4-63.15,37.52-81.19A216.21,216.21,0,0,1,128,33.54a215.77,215.77,0,0,1,34.48,29.27C193.49,95.5,200,125,200,144A71.88,71.88,0,0,1,173.27,199.93Z';

type Channel = { v: number; target: number; next: number; range: [number, number] };

const CHANNELS: Record<'glow' | 'sway' | 'squash', Channel> = {
  glow: { v: 1, target: 1, next: 0, range: [0.5, 1.5] },
  sway: { v: 0, target: 0, next: 0, range: [-3, 3] },
  squash: { v: 1, target: 1, next: 0, range: [0.93, 1.06] },
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);

// Each channel eases toward a random target, and the target is redrawn at a random interval,
// so the flicker never settles into a visible loop. Reduced motion keeps the flame still.
function useFlameNoise(ref: { current: SVGSVGElement | null }) {
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      for (const [name, c] of Object.entries(CHANNELS)) {
        if (now >= c.next) {
          c.target = rand(c.range[0], c.range[1]);
          c.next = now + rand(70, 380);
        }
        c.v += (c.target - c.v) * Math.min(1, dt * rand(6, 20));
        el.style.setProperty(`--flame-${name}`, c.v.toFixed(3));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref]);
}

export function FlameMark({ size = 22 }: { size?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  useFlameNoise(ref);
  return (
    <svg ref={ref} className="flame-mark" width={size} height={size} viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="flame-body" gradientUnits="userSpaceOnUse" x1="0" y1="232" x2="0" y2="30">
          <stop offset="0" stop-color="#ffc83d" />
          <stop offset="0.55" stop-color="#ff7a1f" />
          <stop offset="1" stop-color="#e0331a" />
        </linearGradient>
      </defs>
      <path className="flame-body" fill="url(#flame-body)" d={OUTLINE} />
    </svg>
  );
}
