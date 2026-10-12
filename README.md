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
* **Single-Chunk Focus:** Highlights one line at a time. Other lines fade to half transparency.
* **Chandaḥ-śāstra Prosody Engine:** Normalizes tempo by calculating exact *Laghu* (1 mātrā), *Guru* (2 mātrās), *Pluta* (3 mātrās), and Daṇḍa pause weights.
* **Three Cadence Modes:** **Off** (tap or Space moves on, nothing recorded), **Learn** (each tap is measured to learn your pace, lines do not advance by themselves, a *Steadiness* readout shows consistency), **Auto** (lines advance on their own at the current tempo).
* **Tempo:** one labelled slider from 36 to 130 matras per minute. Learned tempo is clamped to the same range.
* **Laya Scales:**
  - **Dhyāna (ध्यान / Vilambita Laya):** 48 BPM (Meditative, deliberate)
  - **Abhyāsa (अभ्यास / Madhya Laya):** 72 BPM (Standard daily study)
  - **Pārāyaṇa (पारायण / Druta Laya):** 100 BPM (Fluent continuous recital)
* **Ultra-Minimal Zen Mode:** Press `Z` or the 🧘 icon to hide the header and controls, leaving only the verses.
* **Line Kinds:** Mantras are plain ink, with each swara-marked syllable coloured by its tone. Shlokas are green-tinted and medium weight; vakyas (procedure) are purplish grey and italic.

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
* Three themes: **System** (default, follows the OS), **Light**, and **Dark**. Light and dark are near-monochrome with one teal accent and a swara indigo.

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
│   ├── App.tsx            # Shell: header, reader, cadence bar, drop panels, modals
│   ├── components/        # Header, ZenMantraReader, DropPanel, SettingsSheet,
│   │                      # PrakaraDetails, PrakaraBuilderModal, cadence/ controls
│   ├── config/themes.ts   # Theme ids, labels, data-theme attribute
│   ├── data/              # Sukta JSON corpus and default prakaras
│   ├── icons/phosphor.ts  # Vendored Phosphor icon paths (MIT)
│   ├── services/          # Transliteration registry, cadence engine, chunking,
│   │                      # aksharas, titles, swara, URL codec, WebRTC room
│   ├── settings/          # Settings registry and controls
│   ├── stores/            # zustand stores; persisted settings, cadence, prakaras
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
