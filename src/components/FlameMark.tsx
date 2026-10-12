// Same silhouette as favicon.svg. Its glow and flicker live in CSS (components.css), so it reads as a flame on screen.
const BODY =
  'M173.79,51.48a221.25,221.25,0,0,0-41.67-34.34,8,8,0,0,0-8.24,0A221.25,221.25,0,0,0,82.21,51.48C54.59,80.48,40,112.47,40,144a88,88,0,0,0,176,0C216,112.47,201.41,80.48,173.79,51.48Z';
const CORE = 'M96,184c0-27.67,22.53-47.28,32-54.3,9.48,7,32,26.63,32,54.3a32,32,0,0,1-64,0Z';

export function FlameMark({ size = 22 }: { size?: number }) {
  return (
    <svg className="flame-mark" width={size} height={size} viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="flame-body" gradientUnits="userSpaceOnUse" x1="0" y1="232" x2="0" y2="30">
          <stop offset="0" stop-color="#ffc83d" />
          <stop offset="0.55" stop-color="#ff7a1f" />
          <stop offset="1" stop-color="#e0331a" />
        </linearGradient>
        <linearGradient id="flame-core" gradientUnits="userSpaceOnUse" x1="0" y1="216" x2="0" y2="152">
          <stop offset="0" stop-color="#5cc2ff" />
          <stop offset="1" stop-color="#fff4b8" />
        </linearGradient>
      </defs>
      <path className="flame-body" fill="url(#flame-body)" d={BODY} />
      <path className="flame-core" fill="url(#flame-core)" d={CORE} />
    </svg>
  );
}
