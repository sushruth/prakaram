<p align="center">
  <img src="public/favicon.svg" width="96" alt="Prakaram flame logo" />
</p>

# प्रकारम् • Prakaram

> **Ultra-minimal, Zen-Mode Vedic Chanting Companion & Prakara Studio**  
> Built with Bun, Preact, TypeScript, Zustand, Trystero WebRTC, and Modern Layered CSS.

---

## 📚 Documentation & Guides

* **[AGENTS.md](AGENTS.md)** — Operating manual and architectural invariants for AI agents and LLM orchestrators.
* **[ASSUMPTIONS.md](ASSUMPTIONS.md)** — Comprehensive record of architectural assumptions, Chandaḥ-śāstra formulas, Vedic accent encodings, and Phase 2 Panchangam roadmap.
* **[DESIGN.md](DESIGN.md)** — Visual direction, tokens, cadence modes, and the Koshah wiki's routes and article anatomy.
* **[MAINTAINERS.md](MAINTAINERS.md)** — Operational manual, Cloudflare Pages/Workers deployment, and D1 database commands.

---

## ✨ Key Capabilities

### 0. Zen-Mode Vedic Companion & Cadence Learning (Option A)
* **Three-Line Focus:** The active line is bold and fully opaque, its neighbours are at 60%, and the rest fade. At least one line is always highlighted.
* **Chandaḥ-śāstra Prosody Engine:** Normalizes tempo by calculating exact *Laghu* (1 mātrā), *Guru* (2 mātrās), *Pluta* (3 mātrās), and Daṇḍa pause weights. Only chant is timed: Latin text, brackets and verse numbers such as `॥ २ ॥` add nothing.
* **Auto and Learn:** with **Auto** off (the default) you move the lines. With Auto on, lines advance at the set pace, and **Learn** is an option of Auto: six taps teach your pace, then lines advance at the learned pace, which you can still adjust with the slider. A small minimap of the previous, current and next line fills as you sing along; tap it to pause.
* **Pace:** one labelled slider in milliseconds per mātrā (one mora), from 50 to 3000 on a logarithmic scale (833 by default). Learned pace is clamped to the same range.
* **Shared sessions:** guests follow the host's lines and timing and have no local cadence controls. Leave the room to control your own.
* **Learning from every line:** while Learn is on, each line's active time teaches the pace, including lines moved on by the timer or Next. Holding a line counts as slower reading; the ring pause does not.
* **Touch to pause:** touching the highlighted line pauses auto-advance at once; release to resume. In auto modes a touch does not advance the line.
* **Pause when away:** auto-advance pauses when the tab is hidden or loses focus, and resumes on return. Turn it off in settings.
* **Countdown ring:** in Manual, and once Learn has finished, a yellow ring in the header empties over the time left on the current line, then restarts for the next line. Tap it to pause; a yellow pause mark appears inside, and tapping again resumes with the time that was left.
* **Back to line:** when the highlighted line scrolls off screen, a green arrow appears at the bottom right and jumps back to it.
* **Reading position is kept:** each prakara remembers its line, and the prakara you were on is restored after a refresh.
* **Install:** Prakaram is an installable PWA (manifest and icons in `public/`, including a monochrome icon for Android themed icons). A production build registers `public/sw.js`, which keeps the app shell available offline after one visit.
* **Header:** a flame mark and the prakara title on the left (tap the title for details), then four icons: settings, Koshah, parāyaṇam room (the group icon), and zen. Under them, a cadence strip shows the mode (Off, Manual, Learn), a readout, and the countdown ring. Tap the readout for the pace.
* **Ultra-Minimal Zen Mode:** Press `Z` or the lotus icon to hide everything except the verses and that icon. Hidden controls keep their space, so nothing shifts.
* **Line Kinds:** Mantras are plain ink, with each swara-marked syllable coloured: up (svarita) purple, down (anudatta) blue, double up (dirgha svarita) red. Shlokas are green-tinted and medium weight; vakyas (procedure) are purplish grey and italic.

### 1. Authentic Vedic Corpus (*Saswara Veda Mantrah*)
* Editorial benchmark: *Saswara Veda Mantrah* by Sri Ramakrishna Math.
* Clean, modular JSON datasets with authentic Vedic swara cantillation marks:
  - **शान्ति मन्त्राः (Shanti Mantras):** Taittiriya, Brihadaranyaka, Sahana Vavatu
  - **गणपति प्रार्थना (Ganapati Prarthana):** Rigveda 2.23.1 (*Gaṇānāṃ Tvā*) & Atharvashirsha
  - **पुरुष सूक्तम् (Purusha Suktam):** Complete 18 Riks with Taittiriya / Rigveda swaras
  - **श्री सूक्तम् (Sri Suktam):** Complete 16 Riks with Vedic accents
  - **दुर्गा सूक्तम् (Durga Suktam):** Complete hymn to Agni-Durga
  - **नारायण सूक्तम् (Narayana Suktam):** Complete hymn to Cosmic Narayana
* **Koshah wiki:** the library is a git-backed wiki at `#/wiki`, and every article is a JSON file in `src/data`. Sources own text, and their sections are addressable parts. Compositions (including the built-in prakaras, derived as compositions) own no text and reference parts of sources; a source lists them under "Used in". Each article declares what it brings: text, transliteration and translation are derived, and audio, commentary or images are declared in `metadata.media`. The player plays text only.
* **Article:** breadcrumb, the title with a **Follow** (play) button, a **Contents** button for sources with 2+ sections (jump, Follow or Add per section), a collapsed **Info** (notice, lead, facts, Brings, Used in, related articles, categories, Add to my prakaram, Edit and History on GitHub), then the sections. Each section has **[follow]**, Add to my prakaram and **[edit]**. The Sri Rudram prakaram (Namakam and Chamakam) is included, but its text is from Vignanam and its reuse permission is not yet confirmed, so it stays a draft until that is settled.
* **My prakaram:** Add to my prakaram collects whole texts or single sections in a saved basket. `#/wiki/Special:Compose` reorders them, names the result, and either follows it now or saves it with the other prakaras.
* **Nirdeśa (addresses):** every pada (line) has a section-relative number, and where the text prints verse numerals the padyas (verses) are numbered too; tap two numbers to follow, copy or add a range, which snaps to whole padyas (a `padas` toggle refines it). `rudram-namakam/3.2-9` addresses padas 2 to 9 of anuvaka 3, `sri-suktam/1.p2-p4` padyas 2 to 4, and both work in the search box, the wiki address, My prakaram and saved or shared prakarams. Citations are shown in words (`Taittirīya Saṃhitā · caturtha-kāṇḍa · pañcama-prapāṭhaka · tṛtīya-anuvāka`), not as `TS 4.5`. Each kriyā (a step of a prakaram) can carry an optional name and a `kariṣye` sankalpa line.
* **Wiki addresses:** `#/wiki` (main page), `#/wiki/<id>` (article), `#/wiki/<id>/<n>` (one section), `#/wiki/<id>/<s>.<from>-<to>` (padas) and `#/wiki/<id>/<s>.p<n>` (a padya), `#/wiki/Category:<name>`, `#/wiki/Special:Search?q=`, `#/wiki/Special:Random` and `#/wiki/Special:Compose`. Old `#k=` links redirect to the article.
* **Same script everywhere:** all Sanskrit on the wiki and the player goes through one renderer (`src/components/Sanskrit.tsx`), so the chosen script, verse numerals included, applies to every title and line. The wiki uses the player's header, tokens and gutters, with no boxes, borders or shadows.

### 2. Multi-Script Indic Engine
* Client-side, zero-dependency, ultra-fast (>1,000,000 mantras/sec) Brahmic transliteration.
* Flawlessly displays authentic Vedic swaras across:
  - **संस्कृतम् (Devanagari)**
  - **తెలుగు (Telugu)**
  - **ಕನ್ನಡ (Kannada)**
  - **தமிழ் (Tamil)** with standard South Indian subscript numerals (`க₁, க₂, க₃, க₄`)
  - **മലയാളം (Malayalam)**
  - **IAST Roman** with combining Vedic acute, macron-below, and double-acute accents.

### 3. Prakara Studio & Sequence Builder
* Compile order + combination of mantras (e.g. *Ganapati $\rightarrow$ Purusha Suktam $\rightarrow$ Sri Suktam $\rightarrow$ Durga Suktam $\rightarrow$ Narayana Suktam*).
* Insert custom or crowd-sourced vakyas, sankalpams, and procedural instructions in between.
* Save customized Prakaras locally or share instantly.

### 4. P2P WebRTC Parāyaṇam (group recitation) & Link Sharing
* **Parāyaṇam rooms:** a casual, live group recitation, not a prakaram's rite. The app names it for you from Sanskrit terms (for example Bhū-Kṛttikā), the host presses Copy link, and the room is created. Followers open the link (`#room=<id>`) or paste a link or name. The host's lines and cadence synchronize on followers' screens via serverless WebRTC (Trystero).
* **Zero-Server Link Sharing:** Custom Prakaras and cadence configurations compress into native URL fragments (`#p=...`) using `CompressionStream('deflate-raw')`. URL fragments are never sent to servers (100% client-side privacy).

### 5. Accounts (Hidden) & Cloudflare Worker
* **Passkey accounts are hidden.** The UI entry point is not mounted. The code stays in `src/services/passkeyAuth.ts` and `src/components/PasskeyAuthModal.tsx` for the proper build later.
* **Worker verify endpoints fail closed.** `/api/auth/*/verify` returns `501` until WebAuthn verification is implemented in `worker/`.
* **Cloudflare Workers + D1:** the API skeleton and schema live in `worker/`.

### 6. Modern Layered CSS (No Tailwind)
* Native `@layer` cascade, split by concern under `src/styles/`. Rules and borders are governed by `DESIGN.md`.
* Three themes: **System** (default, follows the OS), **Light**, and **Dark**. Light and dark are near-monochrome with one slate-blue accent. The flame, the switch spectrum (yellow, orange, pale blue), the swara colours and the green back-to-line arrow are the only other hues.

---

## 🚀 Quickstart

### Prerequisites
* [Bun](https://bun.sh) (v1.3+ recommended)

### Run Locally
```bash
# 1. Install dependencies
bun install

# 2. Start development server
bun run dev

# 3. Build for production
bun run build

# 4. Run test suite
bun test
```

The last check: 112 tests pass; the production build is one JS file of 294.10 kB (88.94 kB gzipped) and 23.98 kB of CSS. The JS is above the 220 KB target in `AGENTS.md`.

### Cloudflare Worker (Optional Backend)
```bash
cd worker
bunx wrangler dev
```

---

## 📁 Project Structure

```text
├── AGENTS.md              # Operating manual & invariants for coding agents
├── DESIGN.md              # Visual direction, tokens, borders and button rules
├── MAINTAINERS.md         # Deployment, Worker and D1 operations
├── ASSUMPTIONS.md         # Architectural and Vedic assumptions
├── THIRD_PARTY_NOTICES.md # Vendored third-party assets
├── wrangler.jsonc         # Workers static-assets config (serves dist/), previews enabled
├── src/
│   ├── App.tsx            # Shell: player or wiki by hash route, drop panels, modals
│   ├── components/        # Header (and WikiTopBar), ZenMantraReader, LearnIndicator,
│   │                      # LocateLine, DropPanel, SettingsSheet, CadencePanel,
│   │                      # PrakaraDetails, PrakaraBuilderModal, cadence/ controls,
│   │                      # Sanskrit (the one Sanskrit renderer), Wiki* pages
│   ├── config/themes.ts   # Theme ids, labels, data-theme attribute
│   ├── data/              # Sukta JSON corpus and default prakaras
│   ├── hooks/useChunks.ts # Shared chunk list for reader and indicator
│   ├── icons/phosphor.ts  # Vendored Phosphor icon paths (MIT)
│   ├── services/          # Transliteration registry, cadence engine and state
│   │                      # machine, syllabifier, chunking, aksharas, titles, swara
│   │                      # tones, URL codec, WebRTC room, wiki (articles, search),
│   │                      # wikiNav (hash routes), koshah (pieces), basket
│   ├── settings/          # Settings registry and controls
│   ├── stores/            # zustand stores; persisted settings, cadence, prakaras, progress, basket
│   ├── styles/            # index.css entry; one file per concern and @layer
│   └── types/             # Shared TypeScript types
├── worker/
│   ├── src/index.ts       # Worker API (health, register/login options)
│   ├── schema.sql         # D1 schema
│   └── wrangler.jsonc     # Worker configuration
└── .github/workflows/ci.yml  # Typecheck, tests and build on push and PR
```

---

## 📜 License
Everything in the Koshah belongs to the public: we admit only text, translation, commentary, audio and readings dedicated to the public domain (CC0), and nobody owns an edition or a prakaram. The Vedic texts themselves are ancient, but a typed, proofread edition can carry rights, so texts whose permission we cannot confirm stay `draft` until we replace them with our own from the original. Each text's source and licence status is shown in the Koshah and listed in `THIRD_PARTY_NOTICES.md`. Code is released under the MIT License.
