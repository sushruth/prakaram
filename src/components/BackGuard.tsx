import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from './Icon';

const PRESSES = 3;
const IDLE_MS = 5000;

/**
 * Keeps a stray Back (a child's tap, a mis-swipe) from leaving the player. The player holds one extra history entry;
 * Back pops it, and instead of leaving, a "Back 3" button appears at the top. Each further Back, or a tap on the
 * button, counts down; at zero the player really goes back. Left alone for a few seconds, the button hides and resets.
 */
export function BackGuard() {
  const [left, setLeft] = useState<number | null>(null);
  const leftRef = useRef<number | null>(null);
  const idle = useRef<ReturnType<typeof setTimeout>>();

  const set = (n: number | null) => {
    leftRef.current = n;
    setLeft(n);
  };
  const guard = () => history.pushState({ backGuard: true }, '', location.href);

  const press = () => {
    clearTimeout(idle.current);
    const next = leftRef.current === null ? PRESSES : leftRef.current - 1;
    if (next <= 0) {
      set(null);
      history.back();
      return;
    }
    set(next);
    idle.current = setTimeout(() => set(null), IDLE_MS);
  };

  useEffect(() => {
    if (!history.state?.backGuard) guard();
    const onPop = () => {
      // The guard entry was popped: put it back unless this press is the one that leaves.
      const leaving = leftRef.current === 1;
      if (!leaving) guard();
      press();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      clearTimeout(idle.current);
    };
  }, []);

  if (left === null) return null;
  return (
    <button
      type="button"
      className="back-guard"
      onClick={() => {
        // A tap counts like a Back press; the guard entry is still there, so leaving takes two steps back.
        if (leftRef.current === 1) {
          set(null);
          history.go(-2);
          return;
        }
        press();
      }}
    >
      <Icon name="arrow-left" size={18} /> Back {left}
    </button>
  );
}
