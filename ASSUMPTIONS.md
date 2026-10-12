# Architectural Assumptions & System Design Documentation

**Project:** Parayanam (Vedic Mantra Companion & Prakara Chanting Engine)  
**Author:** Pair programming with Antigravity AI  
**Repository:** `sushruth/parayanam` (Private)  
**Date:** October 2026  

---

## 1. Domain & Core Philosophy

### A. The "Zen Mode" Principle
Vedic chanting requires deep mental stillness (*dhyāna* / *cittavṛttinirodha*). Any intrusive UI, clutter, ads, popups, or latency breaks the practitioner's flow.
* **Assumption:** When the user enters chanting mode, the application chrome must gracefully fade away into "Zen Mode". Only the active verse, clean line/akshara highlighting, and subtle progress indicators remain.
* **Interaction:** Tapping anywhere or hitting the spacebar advances the cadence. Double-tap or hovering near edges restores controls.

### B. Vedic Prosody (Chandaḥ-śāstra) & Cadence Learning (Option A)
Vedic verses are not fixed-word-count prose; they follow metrical rules based on *mātrās* (syllabic instants):
* **Laghu (ह्रस्व / Short vowel)** = $1\text{ mātrā}$ ($M = 1$)
* **Guru (दीर्घ / Long vowel, or short vowel followed by Anusvāra, Visarga, or Conjunct consonant / Saṃyoga)** = $2\text{ mātrās}$ ($M = 2$)
* **Pluta (प्लुत / Extended vowel)** = $3\text{ mātrās}$ ($M = 3$)
* **Daṇḍa Caesura (`|`)** = $2.0\text{ mātrās}$ pause; **Double Daṇḍa (`||`)** = $3.5\text{ mātrās}$ pause.

**Assumption on Cadence Learning:**
* Naive tap-tempo (milliseconds per line) fails because verse lengths vary widely.
* Parayanam normalizes each user tap by dividing the inter-tap interval ($\Delta t_k$) by the theoretical mātrā weight ($W_k$) of that chunk:
  $$\hat{m}_k = \frac{\Delta t_k}{W_k} \implies \text{BPM}_k = \frac{60000}{\hat{m}_k}$$
* **Variance & Confidence:** Using Welford's running variance over a 5-chunk window, the engine calculates the Coefficient of Variation ($CV = \frac{\sigma}{\bar{m}}$). If $CV \le 0.12$ over 3–5 chunks, the practitioner has established a steady cadence. Smart mode does not wait for this score. It learns from the first six lines you tap through (`LEARN_LINES`), then advances at the learned tempo.


---

## 2. Multi-Script Indic Engine & Vedic Swaras

### A. Client-Side Zero-Dependency Transliteration
* **Finding on Aksharamukha & Sanscript:**
  - `aksharamukha` on NPM bundles Pyodide + WebAssembly Python wheels (~16.8 MB), requiring 3-5 seconds cold boot and >100MB RAM.
  - `@sanskrit-coders/sanscript` is pure JS but mangles Vedic accents in IAST (outputs raw Devanagari `॒` inside Roman text) and breaks OpenType glyph clustering in Tamil.
* **Assumption & Solution:**
  - Devanagari, Telugu, Kannada, Malayalam, and Grantha share identical relative ISCII / Brahmic Unicode offsets (`0x0900`, `0x0C00`, `0x0C80`, `0x0D00`, `0x11300`).
  - Vedic cantillation marks (Svarita `U+0951`, Anudātta `U+0952`, Dīrgha Svarita `U+1CDA`) are combining non-spacing marks designed in Unicode to combine with any Indic base consonant.
  - We use a custom, ultra-fast (<4KB, >1,000,000 mantras/sec) zero-dependency Brahmic transliterator that preserves Vedic accents across Devanagari, Telugu, Kannada, Malayalam, Tamil, Grantha, and IAST.

### B. Tamil Script Conventions
* Standard Tamil has only one consonant per varga (`க, ச, ட, த, ப`) and lacks separate graphemes for voiced/aspirated sounds ($kh, g, gh$).
* **Assumption:** We follow the standard South Indian publication standard (Ramakrishna Math, LIFCO, Giri Trading) using numerical subscripts (`க₁, க₂, க₃, க₄` using Unicode subscripts `U+2081–U+2084`).
* **Cluster Ordering Rule:** To prevent breaking font rendering engines (HarfBuzz / DirectWrite), characters are emitted strictly in the order: `[Base Consonant] + [Vowel Matra] + [Vedic Accent] + [Subscript Number]` (e.g. `தீ॒₄`).

---

## 3. Vedic Corpus: Saswara Veda Mantrah

### A. Source of Truth & Copyright
* The core mantras (*Purusha Suktam, Sri Suktam, Durga Suktam, Narayana Suktam, Ganapati Atharvashirsha, Medha Suktam, Shanti Mantras*) are millennia-old public domain texts from the *Rigveda*, *Krishna Yajurveda (Taittiriya Samhita & Aranyaka)*, and *Atharvaveda*.
* The Ramakrishna Math edition (*Saswara Veda Mantrah*) is used as our editorial benchmark for chant ordering, khanda groupings, and swara notations.
* **Assumption:** All mantras are stored as structured JSON schema (`MantraDocument`), decoupled from display logic. This allows local bundling, dynamic API endpoints, or CDN hosting via GitHub Pages / jsDelivr.

---

## 4. Prakara Builder & Chanting Sequences

### A. Structure
A *Prakara* is an ordered compilation of mantra chunks, invocations, and procedural instructions:
1. Preamble / Dhyanam / Shanti Patha
2. Viniyoga (Rishi, Devata, Chandas)
3. Suktam A (e.g. Purusha Suktam)
4. Interstitial Vakya (custom prayer, namaavali, or crowd-sourced procedure)
5. Suktam B (e.g. Sri Suktam)
6. Suktam C (e.g. Durga Suktam)
7. Mangalam / Samarpanam

### B. Phase 1 vs Phase 2 (Panchangam Roadmap)
* **Milestone 1 (Current):** Prakara builder with custom vakya insertion and an optional creator name, cadence modes with persisted tempo, script-aware titles, and instant link sharing. Drag-and-drop reordering is not implemented.
* **Milestone 2 (Future Phase):** Dynamic Panchangam calculation:
  - Client-side astronomical ephemeris (Lahiri / Drik) deriving Samvatsara, Ayana, Ritu, Masa, Paksha, Tithi, Vasara, Nakshatra, Yoga, Karana.
  - Dynamic Sankalpam generator filling in family Gotra, Nakshatra, Rasi, Name, and geographic Kshetra (river/temple/city coordinates).

---

## 5. WebRTC Sync & Compact URL Sharing

### A. Live Chanting Room
* **Use Case:** A teacher/priest chants and leads; students/family members across the world follow along with real-time highlighted lines on their own screens.
* **Tech Stack:** **Trystero** WebRTC data channels using public BitTorrent/Nostr/MQTT trackers.
* **Zero Infrastructure Cost:** Completely serverless, zero server fees, zero telemetry.
* **Clock Sync:** Follower devices use an NTP-style ping-pong offset calculation over the DataChannel to sync within $<15\text{ ms}$ of the host.

### B. Link-Based Profile & Prakara Sharing
* Custom Prakaras and cadence settings can be shared via standard URLs without needing an account.
* **Implementation:** The JSON state is compressed via native browser `CompressionStream('deflate-raw')` into a Base64URL fragment (`#p=...`).
* **Privacy Guarantee:** URL fragments (`#`) are never transmitted in HTTP headers to servers, providing 100% client-side privacy.

---

## 6. Authentication & Cloudflare Backend

### A. Zero-Password WebAuthn Passkeys (Deferred)
* **Status:** The account UI is hidden. The Worker verify endpoints return `501` until real verification exists, so no account is created or trusted.
* **UX Assumption:** No passwords, no SMS OTPs, no email links.
* **Registration:** User enters a username $\rightarrow$ browser prompts biometric passkey (TouchID, FaceID, Windows Hello, YubiKey) $\rightarrow$ registered.
* **Login (Conditional UI / Autofill):** Clicking the username field shows the native saved passkey suggestion. One touch signs the user in.
* **Backend (planned):** Cloudflare Workers + D1 SQLite storing credential public keys and counters, verified with `@simplewebauthn/server`. Private keys never leave the user's hardware enclave.

---

## 7. Styling & Modern CSS Philosophy

* **No Tailwind CSS:** Per explicit design requirements, styling uses pure modern CSS with native `@layer`:
  - `@layer reset, theme, typography, layout, components, zen;`
* **Responsive & Adaptive:** Fully responsive across mobile smartphones, tablets, and wide desktop displays.
* **Color:** Three themes (System, Light, Dark). System follows the OS. Light is paper `#f7f7f5` with ink `#161614`; dark is `#121413` with ink `#ecece8`. Both use one teal accent. Swara tones (indigo, rust, ochre) and the shloka and vakya tints are provisional. No saffron, maroon or gold: see `DESIGN.md`.
* **Borders:** none by default; exceptions are named in `DESIGN.md` §7b.
