import { useEffect, useState } from 'preact/hooks';
import { Icon } from './Icon';

const GUARDS = 3;
const IDLE_MS = 5000;

const depth = (): number => (typeof history.state?.backGuard === 'number' ? history.state.backGuard : 0);

/**
 * Keeps a stray Back (a child's tap, a mis-swipe) from leaving the player. The player keeps three extra history
 * entries above itself, so Back walks down them first and a "Back n" pill counts what is left: 3, 2, 1, then out.
 *
 * Browsers skip history entries a page adds without a user gesture (Chrome's back-button intervention), so entries are
 * only ever added during a tap — on entering the player and on any later tap in it — and never inside a Back. A tap
 * anywhere also restores the full count and hides the pill.
 */
export function BackGuard() {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    let idle: ReturnType<typeof setTimeout> | undefined;
    const topUp = () => {
      for (let d = depth() + 1; d <= GUARDS; d += 1) history.pushState({ ...history.state, backGuard: d }, '', location.href);
      setLeft(null);
    };
    const onPop = () => {
      clearTimeout(idle);
      setLeft(depth() + 1);
      idle = setTimeout(() => setLeft(null), IDLE_MS);
    };
    const onTap = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest?.('.back-guard')) topUp();
    };
    topUp();
    window.addEventListener('popstate', onPop);
    window.addEventListener('pointerdown', onTap, true);
    return () => {
      clearTimeout(idle);
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('pointerdown', onTap, true);
    };
  }, []);

  if (left === null) return null;
  return (
    <button type="button" className="back-guard" onClick={() => history.back()}>
      <Icon name="arrow-left" size={18} /> Back {left}
    </button>
  );
}
