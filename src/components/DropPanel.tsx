import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

interface DropPanelProps {
  label: string;
  isOpen: boolean;
  onClose: () => void;
  children: ComponentChildren;
}

export function DropPanel({ label, isOpen, onClose, children }: DropPanelProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const state = isOpen ? 'is-open' : '';
  return (
    <>
      <div className={`drop-scrim ${state}`} onClick={onClose} />
      <section className={`drop-panel ${state}`} role="dialog" aria-label={label} aria-hidden={!isOpen}>
        <div className="drop-body">{children}</div>
      </section>
    </>
  );
}

export function DropHead({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="drop-head">
      <span className="drop-title">{title}</span>
      <button className="icon-btn" onClick={onClose} aria-label={`Close ${title.toLowerCase()}`}>
        <svg width={16} height={16} viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
          <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
        </svg>
      </button>
    </div>
  );
}
