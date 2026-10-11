# MAINTAINERS.md

> **Maintainer Operations & Deployment Manual for Parayanam**

---

## 1. System Architecture Map

```
[ User Browser / PWA ]
  ├── Preact UI (Zen Mode, Reader, Studio, Controls)
  ├── Zustand Stores (Mantra, Cadence, Prakara, Room, Theme)
  ├── Indic Transliteration Engine (Devanagari, Telugu, Kannada, Tamil, Malayalam, IAST)
  ├── Prosodic Syllabifier (Chandaḥ-śāstra Laghu/Guru/Pluta)
  ├── Cadence Learning Engine (Option A tap rhythm, EMA tempo, Welford variance)
  ├── URL Codec (Native CompressionStream Deflate -> Base64URL #p=...)
  └── Trystero WebRTC (Serverless P2P DataChannels via BitTorrent/Nostr)
            │
            ▼ (Optional Cloud Backup & WebAuthn)
[ Cloudflare Workers + D1 SQLite ]
  ├── POST /api/auth/register/options & verify
  ├── POST /api/auth/login/options & verify
  └── D1 Database (Users, Passkey Credentials, Challenges, Stored Prakaras)
```

---

## 2. Deployment Workflows

### A. Frontend Deployment (Cloudflare Pages)

The frontend is an offline-first Single Page App built with Vite:

1. Connect your GitHub repository `sushruth/parayanam` to **Cloudflare Pages**.
2. Configure build settings:
   * **Framework Preset:** Vite
   * **Build Command:** `bun run build`
   * **Build Output Directory:** `dist`
   * **Root Directory:** `/`
3. Environment variables: None strictly required for static hosting.

### B. Backend Deployment (Cloudflare Workers + D1)

If you wish to enable the optional cloud sync and passkey auth backend:

1. **Navigate to the worker directory:**
   ```bash
   cd worker
   ```

2. **Create the Cloudflare D1 SQLite database:**
   ```bash
   bunx wrangler d1 create parayanam-db
   ```
   *Copy the output `database_id` into `worker/wrangler.jsonc` under `d1_databases`.*

3. **Initialize the database schema:**
   ```bash
   bunx wrangler d1 execute parayanam-db --file=./schema.sql --remote
   ```

4. **Update Production Environment Variables in `wrangler.jsonc`:**
   ```jsonc
   "vars": {
     "RP_NAME": "Parayanam",
     "RP_ID": "parayanam.app",             // Your production domain
     "EXPECTED_ORIGIN": "https://parayanam.app",
     "JWT_SECRET": "YOUR_STRONG_RANDOM_SECRET_KEY"
   }
   ```

5. **Deploy the Worker:**
   ```bash
   bunx wrangler deploy
   ```

---

## 3. WebRTC Live Room Maintenance

* **Signaling Strategy:** By default, `src/services/webrtcRoom.ts` uses `trystero/torrent`, which connects via public WebTorrent trackers (`wss://tracker.openwebtorrent.com`, `wss://tracker.btorrent.xyz`).
* **Alternative Nostr Strategy:** If desired, you can switch to `trystero/nostr` by changing the import in `webrtcRoom.ts` to connect via public Nostr relays (`wss://relay.damus.io`, `wss://nos.lol`).
* **No Server Costs:** Neither strategy requires maintaining an active signaling server.

---

## 4. Maintenance Commands Reference

```bash
# Development server with Hot Module Reload
bun run dev

# Production build
bun run build

# Run unit tests
bun test

# Type check without emitting
bunx tsc --noEmit
```
