import { MantraDocument } from '../types/mantra';
export { DEFAULT_PRAKARAS } from './defaultPrakaras';
import shantiMantras from './shantiMantras.json';
import ganapatiPrarthana from './ganapatiPrarthana.json';
import purushaSuktam from './purushaSuktam.json';
import sriSuktam from './sriSuktam.json';
import durgaSuktam from './durgaSuktam.json';
import narayanaSuktam from './narayanaSuktam.json';
import rudramNamakam from './rudramNamakam.json';
import rudramChamakam from './rudramChamakam.json';

export const ALL_SUKTAMS: MantraDocument[] = [
  shantiMantras as MantraDocument,
  ganapatiPrarthana as MantraDocument,
  purushaSuktam as MantraDocument,
  sriSuktam as MantraDocument,
  durgaSuktam as MantraDocument,
  narayanaSuktam as MantraDocument,
  rudramNamakam as MantraDocument,
  rudramChamakam as MantraDocument,
];

export const SUKTA_MAP = new Map<string, MantraDocument>(
  ALL_SUKTAMS.map((s) => [s.id, s])
);
