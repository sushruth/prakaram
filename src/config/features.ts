/**
 * Feature flags for work that is deliberately not shipped yet.
 *
 * `TRANSLATION_ENABLED` is **off on purpose**. Rendering English under a Vedic pada is not a
 * mechanical job: a machine translation of this corpus is a hypothesis to be studied and checked
 * against the commentary, not a feature to turn on. The machinery is kept for that experiment —
 * `src/services/translation/` (provider adapter, cache, queue) and `src/hooks/useChunkTranslations.ts`
 * — but with the flag off there is no settings row, the reader never fetches or renders a
 * translation, and the wiki does not advertise translation as something an article brings.
 *
 * To pick the experiment back up, flip this to `true` and set the reader's `showTranslation`.
 */
export const TRANSLATION_ENABLED = false;
