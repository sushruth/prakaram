import { DropPanel, DropHead } from './DropPanel';
import { CadenceStatus } from './cadence/CadenceStatus';
import { LayaPresets } from './cadence/LayaPresets';
import { TempoControl } from './cadence/TempoControl';
import { AdvanceButton } from './cadence/AdvanceButton';
import { ResetButton, ShareButton } from './cadence/BarActions';

interface CadencePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CadencePanel({ isOpen, onClose }: CadencePanelProps) {
  return (
    <DropPanel label="Cadence" isOpen={isOpen} onClose={onClose}>
      <DropHead title="Cadence" onClose={onClose} />
      <CadenceStatus />
      <TempoControl />
      <LayaPresets />
      <div className="cadence-actions">
        <AdvanceButton />
        <ShareButton />
        <ResetButton />
      </div>
    </DropPanel>
  );
}
