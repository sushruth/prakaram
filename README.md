# पारायणम् • Parayanam

> **Ultra-minimal, Zen-Mode Vedic Chanting Companion & Prakara Studio**  
> Built with Bun, Preact, TypeScript, Zustand, Trystero WebRTC, and Modern Layered CSS.

---

## ✨ Key Capabilities

### 0. Zen-Mode Vedic Companion & Cadence Learning (Option A)
* **Single-Chunk Focus:** Highlights one line/chunk at a time with smooth ambient scrolling.
* **Chandaḥ-śāstra Prosody Engine:** Normalizes tempo by calculating exact *Laghu* (1 mātrā), *Guru* (2 mātrās), *Pluta* (3 mātrās), and Daṇḍa pause weights.
* **Option A Rhythm Learning:** Tap screen or spacebar along with your chant; the engine learns your per-syllable, per-akshara cadence and statistical variance in real-time.
* **Confidence Gauge & Auto-Progress:** When rhythm consistency reaches $\ge 80\%$, the engine suggests "Auto Progress" and can smoothly advance chunk-by-chunk at your personal cadence.
* **Laya Scales:**
  - **Dhyāna (ध्यान / Vilambita Laya):** 48 BPM (Meditative, deliberate)
  - **Abhyāsa (अभ्यास / Madhya Laya):** 72 BPM (Standard daily study)
  - **Pārāyaṇa (पारायण / Druta Laya):** 100 BPM (Fluent continuous recital)
  - **Custom Laya:** Continuous slider from 36 to 130 BPM.
* **Ultra-Minimal Zen Mode:** Press `Z` or the 🧘 icon to make all interface chrome melt away, leaving only the sacred verse and subtle breathing ambient glow.

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

### 5. WebAuthn Passkeys & Cloudflare Edge Backend
* **Zero Passwords:** Sign in or register via device biometrics (TouchID, FaceID, Windows Hello, YubiKey).
* **Conditional UI Autofill:** One-tap sign in directly from the username input.
* **Cloudflare Workers + D1 Backend:** Lightweight API structure included in `worker/` using `@simplewebauthn` and SQLite.

### 6. Modern Layered CSS (No Tailwind)
* Structured using native `@layer reset, theme, typography, layout, components, zen;`.
* Three hand-crafted color palettes:
  - **🌅 Sandhya (Default):** Warm parchment, saffron, terracotta, gold
  - **🌙 Midnight Zen (Dark):** Pure obsidian slate, luminous gold
  - **☀️ Pristine Dawn (Light):** Alabaster and deep earthen ink

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
# Run locally with wrangler
bunx wrangler dev
```

---

## 📁 Project Structure

```
parayanam/
├── ASSUMPTIONS.md                 # Architectural assumptions & mathematical formulas
├── index.html                     # HTML mount root with Indic serif fonts
├── vite.config.ts                 # Preact + Vite bundler configuration
├── tsconfig.json                  # Strict TypeScript configuration
├── src/
│   ├── main.tsx                   # App entry point
│   ├── App.tsx                    # Master coordinator & modal manager
│   ├── types/
│   │   ├── mantra.ts              # Mantra, Chunk, Akshara, and Prakara models
│   │   └── cadence.ts             # Laya presets, metrics, and WebRTC packets
│   ├── styles/
│   │   └── theme.css              # Native @layer modern CSS & Zen styling
│   ├── services/
│   │   ├── transliteration.ts     # Zero-dependency Indic transliterator
│   │   ├── syllabifier.ts         # Chandaḥ-śāstra Laghu/Guru/Pluta prosody parser
│   │   ├── cadenceEngine.ts       # Option A rhythm learning & confidence scoring
│   │   ├── webrtcRoom.ts          # Serverless Trystero WebRTC live synchronization
│   │   ├── urlCodec.ts            # Native CompressionStream URL hash encoder
│   │   └── passkeyAuth.ts         # SimpleWebAuthn client service
│   ├── stores/
│   │   ├── useMantraStore.ts      # Active chunk, script, font-size store
│   │   ├── useCadenceStore.ts     # BPM, laya, confidence, auto-progress store
│   │   ├── usePrakaraStore.ts     # Prakara sequences & compiler store
│   │   ├── useRoomStore.ts        # WebRTC room peer connection store
│   │   └── useThemeStore.ts       # Sandhya/Dark/Light and Zen mode store
│   ├── data/
│   │   ├── shantiMantras.json     # Authentic Shanti Mantras with swaras
│   │   ├── ganapatiPrarthana.json # Rigveda 2.23.1 Ganapati Prarthana
│   │   ├── purushaSuktam.json     # Complete 18 Riks of Purusha Suktam
│   │   ├── sriSuktam.json         # Complete 16 Riks of Sri Suktam
│   │   ├── durgaSuktam.json       # Complete Durga Suktam
│   │   ├── narayanaSuktam.json    # Complete Narayana Suktam
│   │   └── index.ts               # Manifest & default Prakara presets
│   └── components/
│       ├── Header.tsx             # Minimal top bar with controls
│       ├── ZenMantraReader.tsx    # Chanting reader & active chunk highlighter
│       ├── CadenceControlBar.tsx  # Floating bottom bar with BPM slider & tap
│       ├── ScriptSelector.tsx     # Indic script switcher
│       ├── PrakaraBuilderModal.tsx# Custom playlist & vakya compiler
│       ├── ChantingRoomModal.tsx  # WebRTC live room connect/share modal
│       └── PasskeyAuthModal.tsx   # WebAuthn passkey authentication modal
└── worker/
    ├── wrangler.jsonc             # Cloudflare Worker configuration
    ├── schema.sql                 # D1 database schema for credentials
    └── src/
        └── index.ts               # Worker API for passkey attestation & sync
```

---

## 📜 License
Vedic texts are public domain (*sanātana*). Code is released under the MIT License.
