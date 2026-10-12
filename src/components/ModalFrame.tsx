import type { ComponentChildren } from 'preact';
import { Icon } from './Icon';

interface ModalFrameProps {
  title: ComponentChildren;
  onClose: () => void;
  children: ComponentChildren;
}

export function ModalFrame({ title, onClose, children }: ModalFrameProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <h3 className="title-display" style={{ fontSize: '1.25rem', margin: 0, color: 'var(--accent)' }}>
            {title}
          </h3>
          <button className="btn-icon" onClick={onClose} style={{ width: '2rem', height: '2rem' }}>
            <Icon name="x" size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
