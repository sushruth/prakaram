import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Prakara, MantraChunk } from '../types/mantra';
import { ALL_SUKTAMS, DEFAULT_PRAKARAS } from '../data';
import { PIECE_PREFIX, findPiece, itemNirdesa, nirdesaAsPrakara, normalizePrakara, pieceAsPrakara } from '../services/koshah';
import { resolveNirdesa } from '../services/nirdesa';
import { useSettingsStore } from './useSettingsStore';
import { READING_TRANSFORMS, applyTransforms } from '../services/chunking';

interface PrakaraState {
  prakaras: Prakara[];
  activePrakaraId: string;
  selectPrakara: (id: string) => void;
  /** Run one Koshah piece on its own, without saving a prakara. */
  runPiece: (pieceId: string) => void;
  getActivePrakara: () => Prakara;
  getFlattenedChunks: () => MantraChunk[];
  addPrakara: (prakara: Prakara) => void;
  updatePrakara: (prakara: Prakara) => void;
  deletePrakara: (id: string) => void;
}

const isDefault = (p: Prakara) => DEFAULT_PRAKARAS.some((d) => d.id === p.id);

export const usePrakaraStore = create<PrakaraState>()(
  persist(
    (set, get) => ({
      prakaras: DEFAULT_PRAKARAS,
      activePrakaraId: 'maha-prakaram',

      selectPrakara: (id) => set({ activePrakaraId: id }),

      runPiece: (pieceId) => set({ activePrakaraId: PIECE_PREFIX + pieceId }),

      getActivePrakara: () => {
        const { prakaras, activePrakaraId } = get();
        if (activePrakaraId.startsWith(PIECE_PREFIX)) {
          const addr = activePrakaraId.slice(PIECE_PREFIX.length);
          const piece = findPiece(ALL_SUKTAMS, addr);
          const run = piece ? pieceAsPrakara(piece) : nirdesaAsPrakara(addr);
          if (run) return run;
        }
        return prakaras.find((p) => p.id === activePrakaraId) ?? prakaras[0];
      },

      getFlattenedChunks: () => {
        const prakara = get().getActivePrakara();
        const chunks: MantraChunk[] = [];
        let chunkCounter = 1;

        for (const item of prakara.items) {
          if (item.type === 'sukta_ref' && item.suktaId) {
            const r = resolveNirdesa(itemNirdesa(item) ?? item.suktaId);
            for (const ch of r.ok && r.document.id === item.suktaId ? r.chunks : []) {
              chunks.push({ ...ch, chunkNumber: chunkCounter++, kind: 'mantra', isLead: true });
            }
          } else if (item.type === 'vakya') {
            chunks.push({
              id: item.id,
              chunkNumber: chunkCounter++,
              sanskrit: item.customText || '',
              translation: item.customTranslation || item.customTitle || 'Procedural Vakya',
              kind: item.customText?.includes('॥') ? 'shloka' : 'vakya',
              isLead: true,
            });
          }
        }

        const mode = useSettingsStore.getState().splitLines ? 'phrase' : 'verse';
        return applyTransforms(chunks, READING_TRANSFORMS[mode]);
      },

      addPrakara: (prakara) =>
        set((s) => ({ prakaras: [...s.prakaras, prakara], activePrakaraId: prakara.id })),

      updatePrakara: (prakara) =>
        set((s) => ({ prakaras: s.prakaras.map((p) => (p.id === prakara.id ? prakara : p)) })),

      deletePrakara: (id) =>
        set((s) => ({
          prakaras: s.prakaras.filter((p) => p.id !== id),
          activePrakaraId: s.activePrakaraId === id ? DEFAULT_PRAKARAS[0].id : s.activePrakaraId,
        })),
    }),
    {
      name: 'prakaram-prakaras',
      version: 1,
      partialize: (s) => ({
        customPrakaras: s.prakaras.filter((p) => !isDefault(p)),
        activePrakaraId: s.activePrakaraId,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as { customPrakaras?: unknown; activePrakaraId?: unknown };
        const stored = Array.isArray(p.customPrakaras) ? p.customPrakaras.flatMap((x) => normalizePrakara(x) ?? []) : null;
        const custom = stored ?? [];
        return {
          ...current,
          prakaras: [...DEFAULT_PRAKARAS, ...custom.filter((c) => !isDefault(c))],
          activePrakaraId: typeof p.activePrakaraId === 'string' ? p.activePrakaraId : current.activePrakaraId,
        };
      },
    },
  ),
);
