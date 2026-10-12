import { CadenceModeSwitch } from './cadence/CadenceModeSwitch';
import { LayaPresets } from './cadence/LayaPresets';
import { TempoControl } from './cadence/TempoControl';
import { AdvanceButton } from './cadence/AdvanceButton';
import { LearnStatus } from './cadence/LearnStatus';
import { ResetButton, ShareButton } from './cadence/BarActions';

export function CadenceControlBar() {
  return (
    <div className="bottom-bar">
      <CadenceModeSwitch />
      <LayaPresets />
      <TempoControl />
      <AdvanceButton />
      <LearnStatus />
      <ShareButton />
      <ResetButton />
    </div>
  );
}
