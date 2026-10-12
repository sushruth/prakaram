export type TargetScript =
  | 'devanagari'
  | 'telugu'
  | 'kannada'
  | 'malayalam'
  | 'tamil'
  | 'iast';

export interface AksharaToken {
  text: string;
  weight: number;
  swara?: 'anudatta' | 'svarita' | 'dirgha_svarita' | 'none';
}

export type ChunkKind = 'mantra' | 'shloka' | 'vakya';

export interface MantraChunk {
  id: string;
  chunkNumber: number;
  sanskrit: string;
  translation?: string;
  rishi?: string;
  chandas?: string;
  kind?: ChunkKind;
  isLead?: boolean;
  tokens?: AksharaToken[];
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
  suktaId?: string;
  chunkId?: string;
  customTitle?: string;
  customText?: string;
  customTranslation?: string;
}

export interface Prakara {
  id: string;
  title: string;
  description: string;
  author?: string;
  preferredBpm?: number;
  items: PrakaraItem[];
  createdTimestamp: number;
}
