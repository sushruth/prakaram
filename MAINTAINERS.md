# MAINTAINERS.md

> **Maintainer Operations & Deployment Manual for Prakaram**

---

## 1. System Architecture Map

```
[ User Browser / PWA ]
  ├── Preact UI: header (flame, title, learning ring, icons), reader, back-to-line,
  │     drop panels (settings, prakara details, cadence), modals
  ├── zustand stores
  │     ├── persisted: useSettingsStore (prakaram-settings)
  │     │             useCadenceStore  (prakaram-cadence: mode, learned lines, pace)
  │     │             usePrakaraStore  (prakaram-prakaras)
  │     │             useMantraStore   (prakaram-progress: line per prakara, zen)
  │     └── in memory: useRoomStore, cadence pause and learning clock
  ├── Transliteration registry (Devanagari, Telugu, Kannada, Tamil, Malayalam, IAST)
  ├── Chunking (danda phrase split, median-length breaks), aksharas, swara detection
  ├── Cadence mode machine (services/cadenceMachine.ts: Off, Manual, Learn; pure transition function)
  ├── Cadence engine (pace 50-3000 ms per mātrā, learned from taps)
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

Stored preference keys (zustand persist) hold only validated values. Cadence phases change only through `transition()` in `services/cadenceMachine.ts`. See DESIGN.md §5b for the three modes. A corrupt or unknown value falls back to its default on load. The old `prakaram_*` keys are no longer read, except the custom prakara list, which is migrated once.

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

1. In Cloudflare: **Workers & Pages → Create → Import a repository**, select `sushruth/prakaram`.
2. Build command: `bun install --frozen-lockfile && bun run build`
3. Deploy command: `bunx wrangler deploy`. Build cache is enabled on the Workers project.
4. Production branch: `main`. Each push to it builds and deploys.
5. No environment variables are needed for the frontend.

Before every push to `main`, check that CI passed (see §5).

### B. Backend Deployment (Cloudflare Workers + D1)

If you wish to enable the optional cloud sync and passkey auth backend:

1. **Navigate to the worker directory:**
   ```bash
   cd worker
   ```

2. **Create the Cloudflare D1 SQLite database:**
   ```bash
   bunx wrangler d1 create prakaram-db
   ```
   *Copy the output `database_id` into `worker/wrangler.jsonc` under `d1_databases`.*

3. **Initialize the database schema:**
   ```bash
   bunx wrangler d1 execute prakaram-db --file=./schema.sql --remote
   ```

4. **Update Production Environment Variables in `wrangler.jsonc`:**
   ```jsonc
   "vars": {
     "RP_NAME": "Prakaram",
     "RP_ID": "prakaram.sushruth.dev",             // Your production domain
     "EXPECTED_ORIGIN": "https://prakaram.sushruth.dev",
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

`.github/workflows/ci.yml` runs on every push and pull request: install with `--frozen-lockfile`, `tsc --noEmit`, `bun test`, and `bun run build`. The Bun package cache (`~/.bun/install/cache`) is restored from `actions/cache`, keyed on `bun.lock`. Deploys are not part of CI; Cloudflare's Git integration deploys `master`, and its build only needs install and build (the typecheck and tests run in CI).

---

## 6. Known Gaps

* Passkey accounts are hidden, and the Worker verify endpoints fail closed (`501`). Implement WebAuthn verification with `@simplewebauthn/server` before exposing accounts.
* `worker/wrangler.jsonc` still has a placeholder D1 `database_id`, and it commits a `JWT_SECRET`. Move the secret to `wrangler secret put` before deploying the Worker.
* Phosphor icons are vendored from `@phosphor-icons/core`. Re-check the licence text in `THIRD_PARTY_NOTICES.md` when adding icons.

---

## 7. Handoff

**Branches.** Push to `main`. It is the Cloudflare production branch, so every push there builds and deploys.

**Repo.** The repo is `sushruth/prakaram` (renamed from `parayanam`; the old URL redirects). The app is served at `prakaram.sushruth.dev`. The production branch is `main`, which replaced `master`.

**Git access in a new session.** Attach the repo first (`add_repo` for `sushruth/prakaram`), then clone it shallow. A clone of the old name works through the redirect, but attach the new name so the session's repo scope matches. Before pushing from a shallow clone, run `git fetch origin main` so the push sends a thin pack.

**Worker name.** The Cloudflare Worker is still named `parayanam`, and the root `wrangler.jsonc` keeps that name so deploys update the Worker that owns the domain. Renaming it means creating a new Worker and moving `prakaram.sushruth.dev` to it. Do not merge Cloudflare's auto-generated `wrangler.jsonc` PR until that is decided.

**Still to verify on the Cloudflare side:** the Git link to the Workers project (it should build `main`), and that `prakaram.sushruth.dev` routes to the `prakaram` Worker. Neither could be checked from the sandbox.

**Checks before a push** (the same ones CI runs):

```bash
bun install --frozen-lockfile
bunx tsc --noEmit
bun test
bun run build
```

**Measured times** (local, bun 1.4.2, fresh clone): install 3.4 s cold, 0.24 s warm; `tsc` 2.9 s; `bun test` 0.1 s; build 1.6 s; `wrangler deploy --dry-run` 2.0 s warm, 4.4 s cold. CI's check job took about 15 s before the Bun package cache was added. The real Cloudflare upload and queue time were not measured.

**Shipped recently:** installable PWA (manifest, icons, production-only service worker); the Phosphor flame outline with its gradient, with a random-walk flicker and sway (off under reduced motion); a taller cadence strip and flyouts that fade out below their panels; pause and the current line's remaining time persist across reloads; slate-blue accent with a yellow-first spectrum on switches and active words; the Prakaram rename; a GitHub link in settings.

**Open items** (from the UI review; none is in progress):

* Modals use inline styles, rounded cards, pills and a blur overlay, against DESIGN §7b. Restyle them, or name them as an exception in DESIGN.
* Muted text is about 3.2–3.7:1 against the background. Darken `--text-muted` toward 4.5:1.
* Strip tap targets are about 25 px (mode words) and 17 px (readout). Pad them to 40 px.
* `user-select: none` on `html, body` blocks text selection outside learning. Removing it conflicts with press-and-hold to pause on touch.
* Flyout top padding is fixed, so a two-line title can overlap the head. Measure the chrome instead.
* No safe-area handling (`env(safe-area-inset-*)`), and the back-to-line arrow sits over verse text.
* Desktop cadence strip is not aligned to the 960 px reading column.
* The script selector's style differs from the other controls.
* `PasskeyAuthModal.tsx` is unmounted and calls hooks after an early return. Delete it or fix it.
* The back-to-line arrow is green, the only green in the UI. Confirm or change it.
* Known gaps in §6 still apply: the passkey verify endpoints are not implemented, and the Worker config has a placeholder D1 ID and a committed `JWT_SECRET`.
