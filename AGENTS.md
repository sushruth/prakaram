# AGENTS.md

> **Operating Manual & Invariants for Autonomous Coding Agents working on Parayanam**  
> *Target audience: LLM Coding Agents (Antigravity, Opencode, Claude, DeepSeek, Gemini, etc.) and Human Maintainers.*

---

## 1. Mission & System Overview

**Parayanam** (पारायणम्) is an ultra-minimal, privacy-first Vedic chanting companion and Prakara studio. It enables practitioners to chant sacred Vedic texts line-by-line, learns their personal reciting cadence (*laya*) using classical prosody (*Chandaḥ-śāstra*), allows compilation of custom ritual sequences (*Prakaras*), and supports real-time synchronized group chanting via serverless WebRTC.

---

## 2. Technical Stack & Invariants

Agents modifying or extending this repository must strictly adhere to the following stack:

| Component | Choice | Invariant / Constraint |
| :--- | :--- | :--- |
| **Runtime & Package Manager** | **Bun** (`bun 1.3+`) | **Never use `npm` or `yarn`**. Run `bun install`, `bun test`, `bun run dev`. |
| **UI Framework** | **Preact** (`preact/hooks`) | Keep DOM footprint minimal. Do not bloat virtual DOM or add heavy React wrappers. |
| **Language** | **TypeScript** (Strict) | All models and functions must have explicit types in `src/types/`. |
| **State Management** | **Zustand** | Store state in atomic stores (`src/stores/`). Avoid unnecessary re-renders. |
| **Styling & CSS** | **Pure Modern CSS (`@layer`)** | **STRICT RULE: NO TAILWIND**. All styles live in `src/styles/`: `index.css` is the entry and imports one file per concern (`layers.css` declares `@layer reset, theme, typography, layout, components, zen;`, then `reset`, `tokens` (theme colours, light/dark), `typography`, `layout`, `components`, `settings`, `cadence`, `zen`, `responsive`). Import order defines the cascade within each layer, so keep it. Add new rules to the matching concern file, inside the right `@layer`. |
| **Transliteration** | **Zero-Dependency Brahmic Engine** | Do NOT install heavy WASM libraries like Pyodide Aksharamukha. Theme definitions (ids, labels, `data-theme` attribute) live in `src/config/themes.ts`; a new theme also needs its tokens in `src/styles/tokens.css`. Settings rows are descriptors in `src/settings/registry.ts`. Keep transliteration in `src/services/transliteration/` (>1M ops/sec). Each script is one module implementing `ScriptTransliterator`, listed once in `registry.ts`. |
| **P2P Sync** | **Trystero WebRTC** | Serverless WebRTC via BitTorrent/Nostr public trackers. Zero server costs. |
| **State Serialization** | **CompressionStream Deflate** | Custom Prakaras & cadences encode into URL fragments (`#p=...`). Never transmit user playlists to backend HTTP endpoints. |
| **Authentication** | **WebAuthn Passkeys** | **Zero passwords**. Use username + biometric passkeys (TouchID, FaceID, Windows Hello, YubiKey). |
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

## 4. Agent Workflows & Commands

Before concluding any code editing session, an agent must execute and verify:

```bash
# 1. Run unit tests
bun test

# 2. Verify production build and bundle size
bun run build

# 3. Check git status
git status
```

Target benchmarks:
* Unit tests: **100% pass** in $<100\text{ ms}$.
* Production build: **$<1\text{ s}$ build time**, total client bundle $<220\text{ KB}$ uncompressed ($<70\text{ KB}$ gzipped).

---

## 5. Adding New Suktams to the Corpus

When adding a new Suktam from *Saswara Veda Mantrah*:
1. Create a new JSON file in `src/data/<suktamId>.json` matching `MantraDocument` type.
2. Ensure every chunk includes authentic Devanagari swara marks and an English translation.
3. Register the file in `src/data/index.ts` under `ALL_SUKTAMS`.
4. Optionally add it as an item in a default Prakara preset in `src/data/defaultPrakaras.ts`.
5. Run `bun run build` to verify type safety.

---

## 6. Phase 2 Roadmap: Panchangam & Dynamic Sankalpam

Agents tasked with Phase 2 should implement:
1. Client-side ephemeris (Lahiri / Drik astronomical computation) based on browser geolocation or manual date picker.
2. Derivation of: *Samvatsara, Ayana, Ritu, Masa, Paksha, Tithi, Vasara, Nakshatra, Yoga, Karana*.
3. Dynamic template interpolation for family *Gotra*, *Nakshatra*, *Rasi*, *Sharma/Varma*, and local *Kshetra* (river/temple/city).
