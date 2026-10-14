/**
 * Split text at its daṇḍas: one pada per daṇḍa, the daṇḍa kept with the pada before it. Moved here
 * from `src/services/taittiriya.ts` so the build-time parsers share one copy. The player's
 * `src/services/chunking.ts` keeps its own copy.
 */
export const splitAtDanda = (text: string): string[] =>
  text
    .split(/(?<=[।॥])\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
