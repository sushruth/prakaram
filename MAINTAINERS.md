# MAINTAINERS.md

> **Maintainer Operations & Deployment Manual for Prakaram**

---

## 1. System Architecture Map

```
[ User Browser / PWA ]
  ├── Preact UI: player (header, cadence strip, reader, back-to-line) or Koshah wiki,
  │     chosen by the hash route (#/wiki...); drop panels (settings, prakara details,
  │     cadence); modals. Wiki pages: WikiHome, WikiArticle, WikiCategory, WikiSearch,
  │     WikiCompose, under WikiTopBar. All Sanskrit goes through components/Sanskrit.tsx
  ├── zustand stores
  │     ├── persisted: useSettingsStore (prakaram-settings)
  │     │             useCadenceStore  (prakaram-cadence: mode, learned lines, pace)
  │     │             usePrakaraStore  (prakaram-prakaras)
  │     │             useMantraStore   (prakaram-progress: line per prakara, zen)
  │             useBasketStore   (prakaram-basket: My prakaram pieces)
  │     └── in memory: useRoomStore, cadence pause and learning clock
  ├── Transliteration registry (Devanagari, Telugu, Kannada, Tamil, Malayalam, IAST)
  ├── Wiki (services/wiki.ts articles and search, wikiNav.ts routes, koshah.ts pieces,
  │     basket.ts), derived from src/data on each render
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
  "name": "prakaram",
  "compatibility_date": "2026-01-01",
  "previews": {},
  "assets": { "directory": "./dist", "not_found_handling": "single-page-application" }
}
```

1. In Cloudflare: **Workers & Pages → Create → Import a repository**, select `sushruth/prakaram`.
2. Build command: `bun install --frozen-lockfile && bun run build`
3. Deploy command: `bunx wrangler deploy`. Build cache is enabled on the Workers project.
4. Production branch: `main`. Each push to it builds and deploys.
5. No environment variables are needed for the frontend.
6. **PR previews.** The empty `"previews": {}` block in `wrangler.jsonc` makes Cloudflare build a preview for each branch and pull request. The preview URL is `https://<branch>-prakaram.sushruth-sastry.workers.dev`, and the Cloudflare bot comments it on the PR. Production is `main` only.

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
* **Parāyaṇam names and links:** the naming lists (lokas, nakṣatras, māsas, ṛtus, grahas, diśās, nadīs, vāsaras) and the pairing rules live in `src/services/roomName.ts`; an id is `<a>-<b>-<code>` with a 3-character code so two strangers who roll the same words do not meet. The link is `<app>#room=<id>` (`src/services/roomLink.ts`). The room name is not private: anyone who has it can join, and a typed name is accepted too.
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

## 4a. Adding or Editing an Article in the Koshah

The Koshah wiki is built from the documents in `src/data`. Nothing is stored separately: each document gives one article, and each of its sections gives a section of that article (DESIGN.md §5f). The built-in prakaras in `src/data/defaultPrakaras.ts` are derived as composition articles, so they need no document.

### Adding a document

1. Write the document as `src/data/<id>.json`. Its shape is `MantraDocument` in `src/types/mantra.ts`: `id`, `title` (`sanskrit`, `transliteration`, `english`), `metadata`, and `sections`. Each section has `id`, `title`, `sectionNumber` and `chunks`.
2. Fill in `metadata`:
   - `source`: where the text comes from. Info Source.
   - `status`: `draft` until the text is proofread against a printed edition, then `proofread`. Use `reviewed` only after a second check. A missing status counts as `draft`.
   - `license`: the licence or permission note. Info Licence. If permission is not confirmed, say so here and keep `status` at `draft`.
   - `veda`: `rigveda`, `yajurveda`, `samaveda`, `atharvaveda` or `other`. Optional, but the Veda counts on the main page need it.
   - `vedaNote`: the older free-text note, e.g. "Krishna Yajurveda, Taittiriya Samhita 4.5". Kept in the data; the wiki does not show it. Use `veda` for the wiki.
   - `deity`: the deity in plain English.
   - `categories`: names such as `Suktas`, `Rudram` or `Devi`. Each name gets a category page.
   - `summary`: two or three plain English sentences, like the lead of a Wikipedia article.
   - `related`: ids of other documents, shown as Related articles.
   - `usage`: when the text is chanted.
   - `kind`, `parts`, `media`: see Declaring media, and compositions.
3. Register the file in two places in `src/data/index.ts`:
   - Add the document to `ALL_SUKTAMS`. Without this the document has no article.
   - Add its file name to `SUKTA_FILE`, keyed by the document id. The article's [edit] and history links use it. Without it they point at `<id>.json`, which is wrong if the file is named differently.
4. Optionally add it to a prakara in `src/data/defaultPrakaras.ts`, as an item with `type: 'sukta_ref'` and `suktaId`. Set `sectionId` to take one section only.

### Keeping pada numbers stable (nirdeśa)

Readers, prakarams and links store addresses like `rudram-namakam/3.2-9` (section, then pada, a chunk, inside the section) and `sri-suktam/1.p2-p4` (a padya step) (AGENTS.md §1b). A padya number is the numeral printed at the end of a pada (`॥ १ ॥`); keep those numerals in the text exactly as printed, because the padya level is derived from them. Never invent a numeral. So when you edit a source:

- Never renumber or reorder published sections or lines. Fix wording in place; do not split or merge a chunk in the middle of a section.
- Add new text at the end of a section, or as a new last section. Section numbers stay `1..n` with no gaps and no empty section (`nirdesa.test.ts` enforces it).
- If lines truly must move, note it in the commit and bump the document's source/revision note so old links can be reviewed; do not silently shift lines under existing addresses.
- `metadata.place` is optional; fill it only when it is certain from the file's own notes (never from memory), else leave it unset. Shape: `{ "work": { "sanskrit": "तैत्तिरीय संहिता", "english": "Taittirīya Saṃhitā" }, "divisions": [{ "kind": "kāṇḍa", "n": 4 }, { "kind": "prapāṭhaka", "n": 5 }] }`, outermost division first, using the work's own names (`kāṇḍa`, `prapāṭhaka`, `aṣṭaka`, `adhyāya`, `varga`, `maṇḍala`, `sūkta`, `praśna`, `khaṇḍa`, `valli`). Do not list the anuvāka: the section is the anuvāka. `citeInWords` shows it in words (`caturtha-kāṇḍa · pañcama-prapāṭhaka`). Dotted or abbreviated citations such as `TS 4.5` are not used for display, and `metadata.cite` no longer exists. Today only the Namakam (kāṇḍa 4, prapāṭhaka 5) and the Chamakam (kāṇḍa 4, prapāṭhaka 7) have it.

### Declaring media, and compositions

Text, transliteration and translation are derived; do not declare them. Declare only what the text cannot show, in `metadata.media`: `kind` (`audio`, `commentary`, `image`, or an extra `text` or `translation`), and optionally `label`, `language`, `script`, `swara`, `source`, `license`, `url`. Declare only what exists: no audio is declared anywhere yet.

A source (the default) owns its text, and its sections are the parts others can reference as `docId/n`. Something made of parts of sources, such as an extract or a vrata, owns no text: set `metadata.kind` to `composition`, list `metadata.parts`, and leave `sections` empty. Example, referencing parts of a Taittiriya Upanishad-style source:

```json
{
  "id": "shanti-extract",
  "title": { "sanskrit": "", "transliteration": "", "english": "Shanti extract" },
  "metadata": {
    "source": "Extract from Taittiriya Upanishad",
    "kind": "composition",
    "summary": "The peace invocation and the first anuvaka of the Siksha Valli.",
    "parts": [
      { "article": "taittiriya-upanishad", "section": 1, "note": "Shanti patha" },
      { "article": "taittiriya-upanishad", "section": 2 }
    ]
  },
  "sections": []
}
```

Register it in `ALL_SUKTAMS` and `SUKTA_FILE` like any document (or add a default prakara, which is derived into a composition for you). Referenced ids must exist; cycles and missing ids are skipped silently. The source's page then lists it under Used in.

### Editing an existing article

1. Open the article's **Edit** link (in Info), or the **[edit]** link on a section. Both open `src/data/<file>.json` on GitHub.
2. Change the text, or the metadata fields above. Keep `id` and section ids stable: piece ids, saved My prakaram baskets (ids that no longer exist are dropped) and `#/wiki/<id>/<n>` addresses depend on them.
3. Check the status and licence fields after every text change. Do not raise `status` without a check against a printed edition.

### Opening a pull request

The edit links on GitHub propose a branch and a pull request. Otherwise, work on a branch locally:

```bash
git checkout -b article/<id>
git add src/data/<file>.json src/data/index.ts
git commit -m "Koshah: <what changed>"
git push -u origin article/<id>
gh pr create --fill
```

Before opening the PR, run the checks:

```bash
bunx tsc --noEmit && bun test && bun run build
```

Once merged, the wiki updates on the next deployment (section 2.A).

### Licence caution: Vignanam text

`src/data/rudramNamakam.json` and `src/data/rudramChamakam.json` (Sri Rudram, Namakam and Chamakam) are converted from Vignanam's Kannada-script text. **Permission to reuse that text has not been confirmed** (THIRD_PARTY_NOTICES.md).

- Keep both documents at `status: "draft"` and keep the "not yet confirmed" licence note. The wiki shows a notice under their titles while either holds.
- Do not promote the status, remove the note, or copy the text into another document until permission is confirmed in writing.
- To clear it, either get written permission from Vignanam and update THIRD_PARTY_NOTICES.md, or replace the text with one from a source with a stated open licence.

### Converting Kannada-script text

`scripts/kannadaToDocument.ts` turns saswara text in Kannada script into a document with Devanagari source:

```bash
bun scripts/kannadaToDocument.ts <in.txt> <out.json> <id> <idPrefix>
```

- **Input:** one verse line per line. A line that ends `॥ N ॥` closes an anuvaka. The verse number must use ASCII digits (`0`–`9`), because the converter matches only those. A Kannada digit does not close the anuvaka.
- Only characters in the Kannada block are converted. The danda `॥` and the swara marks are shared with Devanagari and are kept as they are.
- Sections are named `Anuvaka 1`, `Anuvaka 2` and so on. Lines after the last marker form `Concluding mantras`. Chunk ids are `<idPrefix>-<section>-<line>`.
- **Output:** the converter writes only `id` and `sections`. Add `title` and `metadata` by hand (step 2 above) before registering the file.
- The output is `draft` until it has been proofread.

---

## 5. Continuous Integration

`.github/workflows/ci.yml` runs on every push and pull request: install with `--frozen-lockfile`, `tsc --noEmit`, `bun test`, and `bun run build`. The Bun package cache (`~/.bun/install/cache`) is restored from `actions/cache`, keyed on `bun.lock`. Deploys are not part of CI; Cloudflare's Git integration deploys `main` (branches and PRs get previews, §2.A), and its build only needs install and build (the typecheck and tests run in CI).

---

## 6. Known Gaps

* Passkey accounts are hidden, and the Worker verify endpoints fail closed (`501`). Implement WebAuthn verification with `@simplewebauthn/server` before exposing accounts.
* `worker/wrangler.jsonc` still has a placeholder D1 `database_id`, and it commits a `JWT_SECRET`. Move the secret to `wrangler secret put` before deploying the Worker.
* Phosphor icons are vendored from `@phosphor-icons/core`. Re-check the licence text in `THIRD_PARTY_NOTICES.md` when adding icons.

---

## 7. Handoff

**Branches.** `main` is the Cloudflare production branch, so every push there builds and deploys. Work on a branch and open a PR: CI runs, and Cloudflare builds a preview of the branch (§2.A item 6).

**Repo.** The repo is `sushruth/prakaram` (renamed from `parayanam`; the old URL redirects). The app is served at `prakaram.sushruth.dev`. The production branch is `main`, which replaced `master`.

**Git access in a new session.** Attach the repo first (`add_repo` for `sushruth/prakaram`), then clone it shallow. A clone of the old name works through the redirect, but attach the new name so the session's repo scope matches. Before pushing from a shallow clone, run `git fetch origin main` so the push sends a thin pack.

**Worker name.** The Worker is `prakaram`. It was recreated after the old `parayanam` Worker was deleted, so the Workers Builds connection and the `prakaram.sushruth.dev` domain binding must be set up again on the new Worker. The root `wrangler.jsonc` name must match the Worker's name, or deploys go to a different Worker.

**Verified:** PR preview builds work with the `"previews": {}` block (branch preview URL and the Cloudflare bot's PR comment).

**Still to verify on the Cloudflare side:** the production deploy of `main` with the `previews` block, after this PR merges; and that `prakaram.sushruth.dev` routes to the `prakaram` Worker. Neither could be checked from the sandbox.

**Checks before a push** (the same ones CI runs):

```bash
bun install --frozen-lockfile
bunx tsc --noEmit
bun test
bun run build
```

**Measured times** (local, bun 1.4.2, fresh clone): install 3.4 s cold, 0.24 s warm; `tsc` 2.9 s; `bun test` 0.1 s; build 1.6 s; `wrangler deploy --dry-run` 2.0 s warm, 4.4 s cold. CI's check job took about 15 s before the Bun package cache was added. The real Cloudflare upload and queue time were not measured.

**Current numbers** (last run, bun 1.4.2): 112 tests pass in 16 files (about 45 ms). `bun run build` takes about 1.3 s and gives a JS bundle of 294.10 kB (88.94 kB gzipped) and CSS of 23.98 kB (5.65 kB gzipped). The JS is above the 220 KB target in `AGENTS.md` §4 (`origin/main` was 273.50 kB, also above it).

**Shipped recently:** the Koshah wiki (git-backed articles at hash routes, sources and compositions, per-article media, Used in backlinks, Follow wording, My prakaram basket and Special:Compose, the player's header on wiki pages, one Sanskrit renderer with a guard test); Auto (cadence) off by default; a monochrome PWA icon for Android themed icons; PR previews; installable PWA (manifest, icons, production-only service worker); the Phosphor flame outline with its gradient, with a random-walk flicker and sway (off under reduced motion); a taller cadence strip and flyouts that fade out below their panels; pause and the current line's remaining time persist across reloads; slate-blue accent with a yellow-first spectrum on switches and active words; the Prakaram rename; a GitHub link in settings.

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
* Confirm permission to reuse the Vignanam text of the Sri Rudram (Namakam and Chamakam), in writing, or replace it with text under a stated open licence. Until then both documents stay `draft` (see `THIRD_PARTY_NOTICES.md`).
* Proofread Rudram Namakam and Chamakam against a printed edition, then set `metadata.status` to `proofread`. The status stays `draft` until the permission above is settled.
* Bundle size: the JS is 294.10 kB against the 220 KB target (and the build is 1.3 s against 1 s). Trim or raise the target in `AGENTS.md` §4.
* Wiki parts are whole sections only. Pada-range and padya parts (`docId/n` plus a span) are not supported.
* Big task, not started: fill the four Vedas as primary sources ourselves, from the original Sanskrit (public-domain printed editions and manuscripts), so the library does not depend on licensed typed editions. Needs the address scheme and the work/edition split first (decided, not built). See `AGENTS.md` §1b.
* Not started (parallel task): glossary tooltips. Every Sanskrit jargon term in the UI shows its English meaning on hover or tap, from one glossary data file and one component that follows the selected script. See the task list.
* Naming (decided and built): the unit is a **Pada** and the grouping above it a **Padya** in the UI (the word "mantra" is overloaded); a step of a prakaram is a **Kriyā**. In code the nirdeśa layer says `pada`, but the identifiers `chunk`, `section`, `sukta_ref`, `suktaId` and `PrakaraItem` still say the old words internally, and stored data and persisted keys are unchanged. Rename them when the refactor lands.
* Dropped by the owner: the player scale rail (anuvaka and pāda numbers, ticks, one line along the media) and line numbers in the player. Do not build them. The rest of that task is done: more space around the three highlighted lines, an unbolded scaled-up centre line, one shared scale/colour/opacity easing, and the minimap following it (DESIGN.md §2, §5b).
* Idea, not built: keep the texts in a separate content repository, with each layer (text, swara marks, translation) stating its own licence. Today the texts live in `src/data` and changes come by pull request.
