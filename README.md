# पारायणम् • Parayanam

> **Ultra-minimal, Zen-Mode Vedic Chanting Companion & Prakara Studio**  
> Built with Bun, Preact, TypeScript, Zustand, Trystero WebRTC, and Modern Layered CSS.

---

## 📚 Documentation & Guides

* **[AGENTS.md](AGENTS.md)** — Operating manual and architectural invariants for AI agents and LLM orchestrators.
* **[ASSUMPTIONS.md](ASSUMPTIONS.md)** — Comprehensive record of architectural assumptions, Chandaḥ-śāstra formulas, Vedic accent encodings, and Phase 2 Panchangam roadmap.
* **[MAINTAINERS.md](MAINTAINERS.md)** — Operational manual, Cloudflare Pages/Workers deployment, and D1 database commands.

---

## ✨ Key Capabilities

### 0. Zen-Mode Vedic Companion & Cadence Learning (Option A)
* **Single-Chunk Focus:** Highlights one line at a time. Other lines fade. At least one line is always highlighted.
* **Chandaḥ-śāstra Prosody Engine:** Normalizes tempo by calculating exact *Laghu* (1 mātrā), *Guru* (2 mātrās), *Pluta* (3 mātrās), and Daṇḍa pause weights. Only chant is timed: Latin text, brackets and verse numbers such as `॥ २ ॥` add nothing.
* **Three modes:** **Off** (you move the lines), **Manual** (lines advance at the set pace; the default), and **Learn** (six taps teach your pace, then lines advance at the learned pace, which you can still adjust with the slider).
* **Pace:** one labelled slider in milliseconds per mātrā (one mora), from 50 to 3000 on a logarithmic scale (833 by default). Learned pace is clamped to the same range.
* **Countdown ring:** in Manual, and once Learn has finished, a yellow ring in the header empties over the time left on the current line, then restarts for the next line. Tap it to pause; a yellow pause mark appears inside, and tapping again resumes with the time that was left.
* **Back to line:** when the highlighted line scrolls off screen, a green arrow appears at the bottom right and jumps back to it.
* **Reading position is kept:** each prakara remembers its line, and the prakara you were on is restored after a refresh.
* **Header:** a flame mark and the prakara title on the left (tap the title for details), then the learning indicator and five icons: settings, cadence, prakara sequences, live room, and zen.
* **Ultra-Minimal Zen Mode:** Press `Z` or the 🧘 icon to hide everything except the verses and that icon. Hidden controls keep their space, so nothing shifts.
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

### 4. P2P WebRTC Live Chanting Room & Link Sharing
* **Live Satsang Rooms:** Host chants while followers' screens synchronize active chunks and cadence in real-time with $<100\text{ ms}$ latency via serverless WebRTC (Trystero).
* **Zero-Server Link Sharing:** Custom Prakaras and cadence configurations compress into native URL fragments (`#p=...`) using `CompressionStream('deflate-raw')`. URL fragments are never sent to servers (100% client-side privacy).

### 5. Accounts (Hidden) & Cloudflare Worker
* **Passkey accounts are hidden.** The UI entry point is not mounted. The code stays in `src/services/passkeyAuth.ts` and `src/components/PasskeyAuthModal.tsx` for the proper build later.
* **Worker verify endpoints fail closed.** `/api/auth/*/verify` returns `501` until WebAuthn verification is implemented in `worker/`.
* **Cloudflare Workers + D1:** the API skeleton and schema live in `worker/`.

### 6. Modern Layered CSS (No Tailwind)
* Native `@layer` cascade, split by concern under `src/styles/`. Rules and borders are governed by `DESIGN.md`.
* Three themes: **System** (default, follows the OS), **Light**, and **Dark**. Light and dark are near-monochrome with one teal accent. Swara colours and the green back-to-line arrow are the only other hues.

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
├── wrangler.jsonc         # Workers static-assets config (serves dist/)
├── src/
│   ├── App.tsx            # Shell: header, reader, drop panels, modals, back-to-line
│   ├── components/        # Header, ZenMantraReader, LearnIndicator, LocateLine,
│   │                      # DropPanel, SettingsSheet, CadencePanel, PrakaraDetails,
│   │                      # PrakaraBuilderModal, cadence/ controls
│   ├── config/themes.ts   # Theme ids, labels, data-theme attribute
│   ├── data/              # Sukta JSON corpus and default prakaras
│   ├── hooks/useChunks.ts # Shared chunk list for reader and indicator
│   ├── icons/phosphor.ts  # Vendored Phosphor icon paths (MIT)
│   ├── services/          # Transliteration registry, cadence engine and state
│   │                      # machine, syllabifier, chunking, aksharas, titles, swara
│   │                      # tones, URL codec, WebRTC room
│   ├── settings/          # Settings registry and controls
│   ├── stores/            # zustand stores; persisted settings, cadence, prakaras, progress
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
Vedic texts are public domain (*sanātana*). Code is released under the MIT License.
