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

export type VedaName = 'rigveda' | 'yajurveda' | 'samaveda' | 'atharvaveda' | 'other';

/** One kind of media an article brings. Text, transliteration and translation are derived; declare anything else (audio, commentary, image). */
export interface MediaDecl {
  kind: 'text' | 'translation' | 'transliteration' | 'audio' | 'commentary' | 'image';
  label?: string;
  language?: string;
  script?: string;
  swara?: boolean;
  source?: string;
  license?: string;
  url?: string;
}

/** A reference to part of a source article: one section (by number), or all of it when `section` is missing. Line ranges are not supported. */
export interface ComposedPart {
  article: string;
  section?: number;
  note?: string;
}

export interface MantraDocument {
  id: string;
  title: {
    sanskrit: string;
    transliteration: string;
    english: string;
  };
  metadata: {
    /** The Veda the text belongs to. */
    veda?: VedaName;
    /** Free-text description of the Veda, branch and references. */
    vedaNote?: string;
    source: string;
    rishi?: string;
    devata?: string;
    chandas?: string;
    /** Review state of the text. Missing means draft. */
    status?: 'draft' | 'proofread' | 'reviewed';
    /** Licence or permission note for this text. */
    license?: string;
    /** The deity addressed, in plain English. */
    deity?: string;
    /** Category names for the wiki, e.g. 'Suktas', 'Rudram', 'Devi'. */
    categories?: string[];
    /** Two or three sentences in plain English, like the lead of a Wikipedia article. */
    summary?: string;
    /** Ids of related documents. */
    related?: string[];
    /** When the text is chanted. */
    usage?: string;
    /** Media this article brings beyond what is derived from its text. */
    media?: MediaDecl[];
    /** `source` (default) owns text and its sections are addressable parts. `composition` owns no text and references parts of sources. */
    kind?: 'source' | 'composition';
    /** For a composition: the parts of other articles it is made of, in order. */
    parts?: ComposedPart[];
  };
  sections: SuktaSection[];
}

export interface PrakaraItem {
  id: string;
  type: 'sukta_ref' | 'vakya';
  suktaId?: string;
  /** Only this section of the sukta (an anuvaka). Omitted means the whole sukta. */
  sectionId?: string;
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
