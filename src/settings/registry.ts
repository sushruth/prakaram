import type { ComponentType } from 'preact';
import { ScriptSelector } from '../components/ScriptSelector';
import { FontSizeStepper, PaceDebugControl, PauseAwaySwitch, PrintedNasalsSwitch, SplitSwitch, ThemeSegmented, WrapSwitch } from './controls';

export interface SettingDescriptor {
  id: string;
  label: string;
  Control: ComponentType;
}

export const SETTINGS: readonly SettingDescriptor[] = [
  { id: 'script', label: 'Script', Control: ScriptSelector },
  { id: 'fontSize', label: 'Text size', Control: FontSizeStepper },
  { id: 'wrap', label: 'Wrap long lines', Control: WrapSwitch },
  { id: 'split', label: 'Split into phrases', Control: SplitSwitch },
  { id: 'pauseAway', label: 'Pause when away', Control: PauseAwaySwitch },
  { id: 'printedNasals', label: 'Spell ꣳ as ग्ं', Control: PrintedNasalsSwitch },
  { id: 'paceDebug', label: 'Debug pace (log every line)', Control: PaceDebugControl },
  { id: 'theme', label: 'Theme', Control: ThemeSegmented },
];
