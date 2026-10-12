# MAINTAINERS.md

> **Maintainer Operations & Deployment Manual for Parayanam**

---

## 1. System Architecture Map

```
[ User Browser / PWA ]
  ├── Preact UI: header (flame, title, learning ring, icons), reader, back-to-line,
  │     drop panels (settings, prakara details, cadence), modals
  ├── zustand stores
  │     ├── persisted: useSettingsStore (parayanam-settings)
  │     │             useCadenceStore  (parayanam-cadence: mode, learned lines, pace)
  │     │             usePrakaraStore  (parayanam-prakaras)
  │     │             useMantraStore   (parayanam-progress: line per prakara, zen)
  │     └── in memory: useRoomStore, cadence pause and learning clock
  ├── Transliteration registry (Devanagari, Telugu, Kannada, Tamil, Malayalam, IAST)
  ├── Chunking (danda phrase split, median-length breaks), aksharas, swara detection
  ├── Cadence mode machine (services/cadenceMachine.ts: Off, Manual, Learn; pure transition function)
  ├── Cadence engine (pace 400-3000 ms per mātrā, learned from taps)
  ├── Syllabifier (mātrā weights; only chant counts, verse numbers ignored)
  ├── URL codec (CompressionStream deflate -> #p=...)
  └── Trystero WebRTC (serverless DataChannels)
            │
            ▼ (optional, not yet used by the UI)
[ Cloudflare Worker + D1 ]
  ├── GET  /api/health
  ├── POST /api/auth/register/options and login/options
  └── POST /api/auth/*/verify  -> 501 until WebAuthn verification is implemented
```

Stored preference keys (zustand persist) hold only validated values. Cadence phases change only through `transition()` in `services/cadenceMachine.ts`. See DESIGN.md §5b for the three modes. A corrupt or unknown value falls back to its default on load. The old `parayanam_*` keys are no longer read, except the custom prakara list, which is migrated once.

---

## 2. Deployment Workflows

### A. Frontend Deployment (Cloudflare Workers with static assets)

Cloudflare Pages is legacy. The frontend ships as a Worker that serves `dist/` through static assets, configured by the root `wrangler.jsonc`:

```jsonc
{
  "name": "parayanam",
  "compatibility_date": "2026-01-01",
  "assets": { "directory": "./dist", "not_found_handling": "single-page-application" }
}
```

1. In Cloudflare: **Workers & Pages → Create → Import a repository**, select `sushruth/parayanam`.
2. Build command: `bun install --frozen-lockfile && bun run build`
3. Deploy command: `npx wrangler deploy`
4. Production branch: `master`. Each push to it builds and deploys.
5. No environment variables are needed for the frontend.

Before every push to `master`, check that CI passed (see §5).

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
bun run dev
bun run build
bun test
bunx tsc --noEmit
```

---

## 5. Continuous Integration

`.github/workflows/ci.yml` runs on every push and pull request: install with `--frozen-lockfile`, `tsc --noEmit`, `bun test`, and `bun run build`. Deploys are not part of CI; Cloudflare's Git integration deploys `master`.

---

## 6. Known Gaps

* Passkey accounts are hidden, and the Worker verify endpoints fail closed (`501`). Implement WebAuthn verification with `@simplewebauthn/server` before exposing accounts.
* `worker/wrangler.jsonc` still has a placeholder D1 `database_id`, and it commits a `JWT_SECRET`. Move the secret to `wrangler secret put` before deploying the Worker.
* Phosphor icons are vendored from `@phosphor-icons/core`. Re-check the licence text in `THIRD_PARTY_NOTICES.md` when adding icons.
