import { create } from 'zustand';
import { Prakara, PrakaraItem, MantraChunk } from '../types/mantra';
import { DEFAULT_PRAKARAS, SUKTA_MAP } from '../data';

interface PrakaraState {
  prakaras: Prakara[];
  activePrakaraId: string;
  selectPrakara: (id: string) => void;
  getActivePrakara: () => Prakara;
  getFlattenedChunks: () => MantraChunk[];
  addPrakara: (prakara: Prakara) => void;
  updatePrakara: (prakara: Prakara) => void;
  deletePrakara: (id: string) => void;
}

const LOCAL_STORAGE_KEY = 'parayanam_custom_prakaras';

function loadInitialPrakaras(): Prakara[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Prakara[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return [...DEFAULT_PRAKARAS, ...parsed];
      }
    }
  } catch (e) {
    console.error('Failed to parse local prakaras:', e);
  }
  return DEFAULT_PRAKARAS;
}

export const usePrakaraStore = create<PrakaraState>((set, get) => ({
  prakaras: loadInitialPrakaras(),
  activePrakaraId: 'maha-parayanam',

  selectPrakara: (id: string) => {
    set({ activePrakaraId: id });
  },

  getActivePrakara: () => {
    const state = get();
    return state.prakaras.find((p) => p.id === state.activePrakaraId) || state.prakaras[0];
  },

  getFlattenedChunks: () => {
    const prakara = get().getActivePrakara();
    const chunks: MantraChunk[] = [];
    let chunkCounter = 1;

    for (const item of prakara.items) {
      if (item.type === 'sukta_ref' && item.suktaId) {
        const sukta = SUKTA_MAP.get(item.suktaId);
        if (sukta) {
          for (const section of sukta.sections) {
            for (const ch of section.chunks) {
              chunks.push({
                ...ch,
                chunkNumber: chunkCounter++,
              });
            }
          }
        }
      } else if (item.type === 'vakya') {
        chunks.push({
          id: item.id,
          chunkNumber: chunkCounter++,
          sanskrit: item.customText || '',
          translation: item.customTranslation || item.customTitle || 'Procedural Vakya',
          isInstruction: true,
        });
      }
    }

    return chunks;
  },

  addPrakara: (newPrakara) => {
    set((s) => {
      const updated = [...s.prakaras, newPrakara];
      const customOnly = updated.filter((p) => !DEFAULT_PRAKARAS.some((dp) => dp.id === p.id));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customOnly));
      return { prakaras: updated, activePrakaraId: newPrakara.id };
    });
  },

  updatePrakara: (prakara) => {
    set((s) => {
      const updated = s.prakaras.map((p) => (p.id === prakara.id ? prakara : p));
      const customOnly = updated.filter((p) => !DEFAULT_PRAKARAS.some((dp) => dp.id === p.id));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customOnly));
      return { prakaras: updated };
    });
  },

  deletePrakara: (id: string) => {
    set((s) => {
      const updated = s.prakaras.filter((p) => p.id !== id);
      const customOnly = updated.filter((p) => !DEFAULT_PRAKARAS.some((dp) => dp.id === p.id));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customOnly));
      return {
        prakaras: updated,
        activePrakaraId: s.activePrakaraId === id ? DEFAULT_PRAKARAS[0].id : s.activePrakaraId,
      };
    });
  },
}));
