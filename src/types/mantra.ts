export type TargetScript =
  | 'devanagari'
  | 'telugu'
  | 'kannada'
  | 'malayalam'
  | 'tamil'
  | 'iast';

export interface AksharaToken {
  text: string;
  weight: number; // 1 = laghu, 2 = guru, 3 = pluta, 0 = punctuation
  swara?: 'anudatta' | 'svarita' | 'dirgha_svarita' | 'none';
}

export interface MantraChunk {
  id: string;
  chunkNumber: number;
  sanskrit: string; // Master Devanagari text with Vedic swara marks
  translation?: string; // Optional English or procedural note
  rishi?: string;
  chandas?: string;
  isInstruction?: boolean; // For interstitial vakyas, sankalpam, dhyanam
  tokens?: AksharaToken[]; // Computed or cached token breakdown
}

export interface SuktaSection {
  id: string;
  title: string;
  sectionNumber: number;
  chunks: MantraChunk[];
}

export interface MantraDocument {
  id: string;
  title: {
    sanskrit: string;
    transliteration: string;
    english: string;
  };
  metadata: {
    veda: string;
    source: string;
    rishi?: string;
    devata?: string;
    chandas?: string;
  };
  sections: SuktaSection[];
}

export interface PrakaraItem {
  id: string;
  type: 'sukta_ref' | 'vakya';
  suktaId?: string; // Refers to MantraDocument.id
  chunkId?: string; // Specific chunk or entire sukta
  customTitle?: string;
  customText?: string; // Sanskrit text for custom vakya
  customTranslation?: string; // Guidance / procedure
}

export interface Prakara {
  id: string;
  title: string;
  description: string;
  preferredBpm?: number;
  items: PrakaraItem[];
  createdTimestamp: number;
}
