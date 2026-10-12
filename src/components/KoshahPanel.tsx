import { DropHead, DropPanel } from './DropPanel';

interface KoshahPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** Open the prakara composer (the existing modal). */
  onCompose: () => void;
}

// Filled in by the Koshah panel task.
export function KoshahPanel({ isOpen, onClose }: KoshahPanelProps) {
  return (
    <DropPanel label="Koshah" isOpen={isOpen} onClose={onClose}>
      <DropHead title="Koshah" onClose={onClose} />
    </DropPanel>
  );
}
