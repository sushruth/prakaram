# AGENTS.md

> **Operating Manual & Invariants for Autonomous Coding Agents working on Prakaram**  
> *Target audience: LLM Coding Agents (Antigravity, Opencode, Claude, DeepSeek, Gemini, etc.) and Human Maintainers.*

---

## 1. Mission & System Overview

**Prakaram** (प्रकारम्) is an ultra-minimal, privacy-first Vedic chanting companion and Prakara studio. It enables practitioners to chant sacred Vedic texts line-by-line, learns their personal reciting cadence (*laya*) using classical prosody (*Chandaḥ-śāstra*), allows compilation of custom ritual sequences (*Prakaras*), and supports real-time synchronized group chanting via serverless WebRTC.

---

## 1b. Mental Model of the Media

Everything in the library is either a **source** or a **prakaram**. Keep this split when adding content, data fields or UI.

* **Sources are primary things.** The four Vedas (Rigveda, Yajurveda, Samaveda, Atharvaveda) with their samhitas, brahmanas, aranyakas and upanishads (a Taittiriya Upanishad is a source), plus shlokas (the Gita, stotras, smriti and itihasa verses), songs (bhajans, kirtanas, devotional songs) and other primary texts. A source owns its text and its media (swara text, transliteration, translation, audio, commentary). It is an article in the wiki, and its sections are the addressable parts.
* **Prakarams are combinations.** A vrata, an upakarma, a puja, a parayana or any custom sequence is a composition. It owns no source text. It is an ordered list of references to parts of sources (`metadata.parts`, or the items of a prakara), and it shows the referenced text inline. Its own words are only procedure: the sankalpa, instructions and links between parts (vakyas).
* **The four Vedas are ours to fill, from the original Sanskrit.** The Rigveda, Yajurveda (both recensions we care about), Samaveda and Atharvaveda are the primary sources of the library, and we build them ourselves from the original Sanskrit texts (public-domain printed editions and manuscripts, checked against each other), not by copying a typed edition whose licence forbids it. This is a task of its own, separate from the wiki and the player. Until it is done the library holds only a few suktas, some typed from licensed editions that stay `draft` (see `MAINTAINERS.md` §7). Plan for it: addresses and editions first (see below), then fill one Veda at a time.
* **Decompose, never copy.** People take parts out of a source to make something new, so the parts must be addressable and the source stays the single copy. Never paste source text into a composition. A source shows where it is used (Used in); a composition shows where each part comes from.
* **Media belong to sources, compositions inherit.** What a source brings is declared on it (Brings). A composition brings what its parts bring. The player plays text today; other media are declared for later.
* **Where it shows in the code:** `metadata.kind` (`source` by default, `composition`), `metadata.parts`, `metadata.categories` and `metadata.veda` for classification, `metadata.media` for declared media, and `src/services/wiki.ts` for the derived view. A new song or shloka collection is a source with its own categories. A new vrata is a composition. Section 3E has the wiki rules.

### Core belief: everything belongs to the public

Everything in the Koshah belongs to the public. We admit only text, translation, commentary, audio and readings that their authors have dedicated to the public domain (CC0), and nobody owns an edition, a reading or a prakaram. A typed edition that carries rights we cannot clear stays out, or stays `draft` until we replace it with our own text from the original. Provenance (which printed edition or manuscript a text was established from) is recorded so that scholars can check it, and it is never a licence. Contributions that need credit-only licences are not accepted.

### Canonical text, readings and the model going forward (decided, not built)

* Each source has **one canonical text** (`mūla`), established by us from the original Sanskrit and kept in git (git history is its version history). Recensions (`śākhā`) are separate sources: Taittiriya, Kāṇva and Mādhyandina differ in wording and accents.
* A **reading** (`pāṭhāntara`) is a named patch on a source: the mantra address, the position, and the replacement or skip, anchored to the source revision it was made against (marked stale if the source moves). A prakaram step can carry readings. A personal reading stays in the user's prakaram and never alters the source. A reading can be published as a named variant, attributed and not owned, and a widely used variant or a real correction can be promoted into the source by pull request.
* Order of work: (1) the address scheme (`nirdeśa`) at mantra level with ranges, (2) steps that carry readings in the data model, (3) the editing UI for readings, (4) the contents page per source, (5) audio with per-line timings, (6) songs and shlokas.

### Naming (Sanskrit terms, with English glosses in the UI)

| Concept | Term | Gloss |
| :--- | :--- | :--- |
| Source text | **Mūla** (मूल) | the root text |
| Recension | **Śākhā** (शाखा) | branch |
| Composition (vrata, upakarma, puja, parayana) | **Prakāra / Prakaram** (प्रकारम्) | arrangement |
| Rite or procedure around a composition | **Vidhi** (विधि) | the prescribed procedure |
| Ordered steps | **Krama** (क्रम) | sequence |
| One step | **Aṅga** (अङ्ग) | a limb of the rite |
| Address of a mantra or range | **Nirdeśa** (निर्देश) | citation |
| Variant or personal reading | **Pāṭhāntara** (पाठान्तर) | another reading |
| What an article brings | **Sāmagrī** (सामग्री) | the materials |
| Translation | **Anuvāda** (अनुवाद) | |
| Commentary | **Bhāṣya** (भाष्य) | |
| Audio recording | **Dhvani** (ध्वनि) | |
| The library | **Koshah** (कोश) | treasury |

The traditional divisions keep their own names in addresses and breadcrumbs (kāṇḍa, prapāṭhaka, anuvāka, mantra). In the UI, show the Sanskrit term with its English gloss on first use. Code identifiers move to these names when the refactor lands; until then they keep the current English ones (`source`, `composition`, `parts`, `media`).

---

## 2. Technical Stack & Invariants

Agents modifying or extending this repository must strictly adhere to the following stack:

| Component | Choice | Invariant / Constraint |
| :--- | :--- | :--- |
| **Runtime & Package Manager** | **Bun** (`bun 1.3+`) | **Never use `npm` or `yarn`**. Run `bun install`, `bun test`, `bun run dev`. |
| **UI Framework** | **Preact** (`preact/hooks`) | Keep DOM footprint minimal. Do not bloat virtual DOM or add heavy React wrappers. |
| **Language** | **TypeScript** (Strict) | All models and functions must have explicit types in `src/types/`. |
| **State Management** | **Zustand** | Store state in atomic stores (`src/stores/`). Avoid unnecessary re-renders. Preferences that must survive reloads use zustand `persist` with a `merge` that validates every field (see `persistence.ts`). Persisted: settings, cadence (mode, learned lines, pace), prakaras, reading progress (line per prakara, zen), and the My prakaram basket (`useBasketStore`). Keep other view state (learning clock, pause, room) in memory. Never read `localStorage` by hand in a store. |
| **Styling & CSS** | **Pure Modern CSS (`@layer`)** | **STRICT RULE: NO TAILWIND**. Borders, outlines and shadows are not used unless `DESIGN.md` §7b names the exception. This applies to the wiki as much as the player. All styles live in `src/styles/`: `index.css` is the entry and imports one file per concern (`layers.css` declares `@layer reset, theme, typography, layout, components, zen;`, then `reset`, `tokens` (theme colours, light/dark), `typography`, `layout`, `components`, `settings`, `wiki`, `wikishell`, `cadence`, `zen`, `responsive`). Import order defines the cascade within each layer, so keep it. Add new rules to the matching concern file, inside the right `@layer`. |
| **Transliteration** | **Zero-Dependency Brahmic Engine** | Do NOT install heavy WASM libraries like Pyodide Aksharamukha. Theme definitions (ids, labels, `data-theme` attribute) live in `src/config/themes.ts`; a new theme also needs its tokens in `src/styles/tokens.css`. Settings rows are descriptors in `src/settings/registry.ts`. Keep transliteration in `src/services/transliteration/` (>1M ops/sec). Each script is one module implementing `ScriptTransliterator`, listed once in `registry.ts`. |
| **P2P Sync** | **Trystero WebRTC** | Serverless WebRTC via BitTorrent/Nostr public trackers. Zero server costs. |
| **State Serialization** | **CompressionStream Deflate** | Custom Prakaras & cadences encode into URL fragments (`#p=...`). Never transmit user playlists to backend HTTP endpoints. |
| **Authentication** | **WebAuthn Passkeys** (deferred) | **Zero passwords**. The account UI is hidden and the Worker verify endpoints return `501`. Do not expose accounts or mint sessions until verification with `@simplewebauthn/server` is implemented. |
| **Backend (Optional)** | **Cloudflare Workers + D1** | Keep backend code isolated in `worker/` using Hono and `@simplewebauthn`. |

---

## 3. Non-Negotiable Vedic & Linguistic Invariants

When editing or generating Vedic texts and transliteration logic:

### A. Swara Preservation
* **Never strip or replace Vedic cantillation marks**:
  - `U+0951` (॑) : *Svarita* (high pitch)
  - `U+0952` (॒) : *Anudātta* (low pitch)
  - `U+1CDA` (᳚) : *Dīrgha Svarita* (independent long accent)
* Canonical source text in `src/data/*.json` is always stored in **Devanagari with explicit swaras**.

### B. Tamil Script Clustering Order
Standard Tamil lacks separate letters for aspirated consonants ($kh, g, gh$). We use South Indian subscript digits (`U+2081–U+2084`).
* **Correct Unicode Cluster Order**:
  $$\text{[Base Consonant]} + \text{[Matra/Virama]} + \text{[Vedic Accent]} + \text{[Subscript Number]}$$
  Example: `தீ॒₄` (base `த` + matra `ீ` + anudatta `॒` + subscript `₄`).
* **Wrong Order**: Placing subscripts before matras (e.g. `த₄ீ`) breaks OpenType text rendering engines (HarfBuzz/DirectWrite).

### C. Chandaḥ-śāstra Cadence Normalization
Do not calculate cadence using raw word counts. Sanskrit prosody uses *mātrās*:
* **Laghu (ह्रस्व)** = $1\text{ mātrā}$
* **Guru (दीर्घ / संयोगे परे)** = $2\text{ mātrās}$ (long vowel or short vowel followed by conjunct/anusvara/visarga)
* **Pluta (प्लुत)** = $3\text{ mātrās}$
* **Daṇḍa Caesura (`|`)** = $2.0\text{ mātrās}$ pause; **Double Daṇḍa (`||`)** = $3.5\text{ mātrās}$ pause.

---

### D. Line Kinds and Display Rules
* A line is **swara** if its Devanagari source contains U+0951, U+0952 or U+1CDA (`src/services/swara.ts`). Detect swara on the source, never on transliterated output.
* A **shloka** is a custom verse ending in `॥`; a **vakya** is other procedural text. Sukta lines are **mantras**.
* Titles are shown by Sanskrit akshara count (`src/services/aksharas.ts`), never by UTF-16 length. The header limit is the longest default title.
* Titles and Sanskrit labels follow the selected script; English text does not change.
* Mantra text is ink. Swara syllables use `--swara-up` (purple), `--swara-down` (blue) and `--swara-double` (red) as direct colours, not tints.
* Timing counts only chant: Devanagari letters, marks, swara and dandas (`src/services/syllabifier.ts`). Latin text, brackets, pipes and verse numbers add no mātrās. `ꣳ` is one mātrā of its own.
* Every render and screenshot shows at least one highlighted (active) line. If the active line has scrolled off screen, scroll back to it before capturing.
* **One Sanskrit renderer.** Sanskrit text and titles become visible only through `src/components/Sanskrit.tsx` (`Sanskrit`, `SanskritTitle`, `ArticleTitle`, `ArticleSubtitle`, and the hooks `useScript`, `useSanskritText`, `useTitleText`). They read the selected script from the settings store, so a script change re-renders everywhere, and verse numerals are transliterated per script (Arabic digits in Tamil and IAST). Components must not call `transliterateVedic` or `renderVedic`, or read `title.sanskrit`, directly. `src/components/sanskritGuard.test.ts` fails the build if one does.
* Cadence phases (`off`, `manual`, `waiting`, `measuring`, `engaged`) change only through `transition()` in `src/services/cadenceMachine.ts`, applied by the cadence store. Auto-advance runs in `manual` and `engaged`, unless paused. Auto (cadence) is off by default (`INITIAL_LEARNING` is `off`); saved settings are kept. Do not set `phase` by hand. The transition table is in `DESIGN.md` §5b.

### E. Koshah Wiki

* The wiki is derived from `src/data` on each render (`src/services/wiki.ts`); nothing is stored. Routes are hash routes parsed in `src/services/wikiNav.ts`: `#/wiki`, `#/wiki/<id>`, `#/wiki/<id>/<n>`, `#/wiki/Category:<name>`, `#/wiki/Special:Search?q=`, `Special:Random`, `Special:Compose`. Old `#k=` links redirect.
* A **source** owns text and its sections are the addressable parts (`docId/n`; line ranges are not supported). A **composition** (`metadata.kind: 'composition'`, `metadata.parts`) owns no text and references parts. The default prakaras are derived as compositions. Do not copy text into a composition.
* Media are declared per article: text, transliteration and translation are derived; declare only audio, commentary, images or extras in `metadata.media`. The player plays text only.
* The action word is **Follow** (the cadence follows the reader), not "Chant". The article's own play button is the Phosphor `play` icon.
* **My prakaram** is `useBasketStore` (`prakaram-basket`, persisted, validated on load). Section pieces keep their `sectionId`. Following a composition saves it as a prakara first, so it re-saves each time.
* Wiki pages use the player's header (`WikiTopBar`), tokens and gutters, and obey `DESIGN.md` §7b. Layout and anatomy are in `DESIGN.md` §5f.

---

## 4. Agent Workflows & Commands

Before concluding any code editing session, an agent must execute and verify:

```bash
# 1. Type check (CI runs this too)
bunx tsc --noEmit

# 2. Run unit tests
bun test

# 3. Verify production build and bundle size
bun run build

# 4. Check git status
git status
```

Target benchmarks:
* Unit tests: **100% pass** in $<100\text{ ms}$.
* Production build: **$<1\text{ s}$ build time**, total client bundle $<220\text{ KB}$ uncompressed ($<70\text{ KB}$ gzipped).

Current state (last measured): 112 tests pass in about 45 ms. The build takes about 1.3 s and the JS bundle is 294.10 kB (88.94 kB gzipped), so the bundle and build time are above target (`origin/main` was already 273.50 kB, 82.88 kB gzipped).

---

Handoff, the repo-rename checklist and open items are in `MAINTAINERS.md` §7. Read it before starting a new session.

---

## 5. Adding New Suktams to the Corpus

When adding a new Suktam from *Saswara Veda Mantrah*:
1. Create a new JSON file in `src/data/<suktamId>.json` matching `MantraDocument` type.
2. Ensure every chunk includes authentic Devanagari with swara marks. Translations may be kept in the data but are not displayed.
3. Register the file in `src/data/index.ts` under `ALL_SUKTAMS`.
4. Add its file name to `SUKTA_FILE` in `src/data/index.ts` (the wiki's edit and history links use it). Optionally add it as an item in a default Prakara preset in `src/data/defaultPrakaras.ts`; that preset then appears as a composition.
5. Set `metadata.veda`, `deity`, `categories`, `summary`, `related` and `usage` (the wiki reads them), and `metadata.status` and `metadata.license` as in MAINTAINERS.md §4a. Status is `draft` until proofread, and text with unconfirmed permission stays `draft`.
6. Run `bun run build` to verify type safety.

---

## 6. Phase 2 Roadmap: Panchangam & Dynamic Sankalpam

Agents tasked with Phase 2 should implement:
1. Client-side ephemeris (Lahiri / Drik astronomical computation) based on browser geolocation or manual date picker.
2. Derivation of: *Samvatsara, Ayana, Ritu, Masa, Paksha, Tithi, Vasara, Nakshatra, Yoga, Karana*.
3. Dynamic template interpolation for family *Gotra*, *Nakshatra*, *Rasi*, *Sharma/Varma*, and local *Kshetra* (river/temple/city).
