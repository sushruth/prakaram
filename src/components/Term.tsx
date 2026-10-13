// A Sanskrit jargon word with its English meaning on hover, focus or tap. Data: src/data/glossary.json.
// The word goes through the single renderer (<Sanskrit>), so it follows the selected script. Pass children to keep
// an English label ("Brings") and still show the tooltip.
import type { ComponentChildren } from 'preact';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { GLOSSARY } from '../services/glossary';
import { Sanskrit } from './Sanskrit';

// One tooltip at a time: opening one closes the previous.
let closeCurrent: (() => void) | undefined;

export function Term({ id, children }: { id: string; children?: ComponentChildren }) {
  const e = GLOSSARY[id];
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const tipId = useId();
  const mouse = useRef(false);
  const shut = useRef(() => setOpen(false));

  const show = (v: boolean) => {
    if (v) {
      if (closeCurrent && closeCurrent !== shut.current) closeCurrent();
      closeCurrent = shut.current;
    } else if (closeCurrent === shut.current) closeCurrent = undefined;
    setOpen(v);
  };

  // Above the word, clamped to the viewport; below only when there is no room above.
  useLayoutEffect(() => {
    if (!open || !btn.current || !tip.current) return;
    const r = btn.current.getBoundingClientRect();
    const t = tip.current;
    const w = t.offsetWidth;
    const h = t.offsetHeight;
    const vw = document.documentElement.clientWidth;
    t.style.left = `${Math.max(8, Math.min(r.left + r.width / 2 - w / 2, vw - w - 8))}px`;
    t.style.top = `${r.top - h - 6 >= 8 ? r.top - h - 6 : r.bottom + 6}px`;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const key = (ev: KeyboardEvent) => ev.key === 'Escape' && show(false);
    const away = (ev: Event) => !btn.current?.contains(ev.target as Node) && show(false);
    const scroll = () => show(false);
    document.addEventListener('keydown', key);
    document.addEventListener('pointerdown', away);
    window.addEventListener('scroll', scroll, true);
    return () => {
      document.removeEventListener('keydown', key);
      document.removeEventListener('pointerdown', away);
      window.removeEventListener('scroll', scroll, true);
      if (closeCurrent === shut.current) closeCurrent = undefined;
    };
  }, [open]);

  if (!e) return <>{children}</>;
  return (
    <span className="term-wrap">
      <button
        ref={btn}
        type="button"
        className="term"
        aria-describedby={open ? tipId : undefined}
        onPointerDown={(ev) => (mouse.current = ev.pointerType === 'mouse')}
        onPointerEnter={(ev) => ev.pointerType === 'mouse' && show(true)}
        onPointerLeave={(ev) => ev.pointerType === 'mouse' && show(false)}
        onFocus={(ev) => ev.currentTarget.matches(':focus-visible') && show(true)}
        onBlur={() => show(false)}
        onClick={() => (mouse.current ? show(true) : show(!open))}
      >
        {children ?? <Sanskrit text={e.sa} />}
      </button>
      {open && (
        <span ref={tip} id={tipId} role="tooltip" className="term-tip">
          <span className="term-gloss"><Sanskrit text={e.sa} /> · {e.gloss}</span>
          {e.note && <span className="term-note">{e.note}</span>}
        </span>
      )}
    </span>
  );
}
