import { DropPanel, DropHead } from './DropPanel';
import { TempoControl } from './cadence/TempoControl';
import { AdvanceButton } from './cadence/AdvanceButton';
import { ResetButton, ShareButton } from './cadence/BarActions';

interface CadencePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CadencePanel({ isOpen, onClose }: CadencePanelProps) {
  return (
    <DropPanel label="Pace" isOpen={isOpen} onClose={onClose}>
      <DropHead title="Pace" onClose={onClose} />
      <TempoControl />
      <div className="cadence-actions">
        <AdvanceButton />
        <ShareButton />
        <ResetButton />
      </div>
    </DropPanel>
  );
}
