# `sources/` — vendored source text

The text of every source is **compiled into this directory by CI/build scripts** and served to the app
from **jsDelivr**, off this repo. The app never parses upstream HTML at runtime and never uses a proxy.
`src/services/adapters/` is gone; parsing lives in `scripts/sources/`.

## Licences of files in this directory

This directory is a **collection of independently licensed sources**; the repository as a whole is not
relicensed. Every generated file repeats its licence in `metadata.provenance.license` (kept equal to
`metadata.license`), and the licence files sit beside this README:

| files | upstream | licence | licence file |
| :-- | :-- | :-- | :-- |
| `rigveda-1/` … `rigveda-10/` (`rigveda-<m>/`) | DharmicData | **ODbL 1.0** | `LICENSE-ODbL.txt` |
| `taittiriya-samhita-4/`, `taittiriya-aranyaka-1/` … `-10/` | taittiriya.com | permission not yet confirmed | — |
| `rigveda-khila-sri/` | sanskritdocuments.org | permission not yet confirmed | — |

The `rigveda-*` files are a Derivative Database of DharmicData and are licensed ODbL 1.0; each carries
the ODbL §4.3 notice "Contains information from DharmicData …" and the licence URI, and the licence
text is in `LICENSE-ODbL.txt`. The `taittiriya-samhita-4`, `taittiriya-aranyaka-*` and `rigveda-khila-sri` files stay
`status: "draft"` and carry **no** open licence until the upstream permission is confirmed in writing
(see `docs/licence-compliance.md` §2.3, §5). The application code (`src/`, `scripts/`, `worker/`) is not
covered by these content licences.

## Layout

```text
sources/
  README.md            this file
  manifest.json        index of every file + provenance (generated)
  <docId>.json         one processed MantraDocument per source (generated)
```

`<docId>` is exactly the live-source id the app already addresses:

| docId | file | upstream |
| :-- | :-- | :-- |
| `rigveda-1` … `rigveda-10` | `rigveda-<m>.json` | DharmicData `Rigveda/rigveda_mandala_<m>.json` @ pinned commit |
| `taittiriya-samhita-4` | `taittiriya-samhita-4.json` | `taittiriya.com/samhita/kanda_4_prashna_<p>` (p = 1…7) |
| `taittiriya-aranyaka-1` … `-10` | `taittiriya-aranyaka-<p>.json` | `taittiriya.com/aranyaka/prapathaka_<p>` |
| `rigveda-khila-sri` | `rigveda-khila-sri.json` | `sanskritdocuments.org/doc_veda/s-sukta-accent.html` |

## Processed file

A processed file is a `MantraDocument` (see `src/types/mantra.ts`) with one extra field:

```jsonc
"metadata": {
  // ...the usual MantraDocument metadata...
  "provenance": {
    "upstreamUrl": "https://taittiriya.com/aranyaka/prapathaka_3",
    "upstreamRef": "2026-10-13",          // commit sha | Last-Modified date | fetch date, whichever the host offers
    "retrievedAt": "2026-10-13",          // ISO date the text was fetched
    "parser": "aranyaka@1",               // parser id + version
    "license": "Text from taittiriya.com; permission not yet confirmed.",
    "attribution": "Taittirīya Āraṇyaka, prapāṭhaka 3 — taittiriya.com",
    "sha256": "<hex>"                     // sha256 of the document JSON with sha256 blanked
  }
}
```

`metadata.remoteUrl` keeps pointing at the human-readable upstream page.

## `manifest.json`

```jsonc
{
  "pin": "<git sha the app should pin, or \"local\">",
  "generatedAt": "2026-10-13T00:00:00.000Z",
  "sources": [
    { "id": "taittiriya-aranyaka-3", "file": "taittiriya-aranyaka-3.json", "sha256": "<hex>", "provenance": { /* as above */ } }
  ]
}
```

## Runtime contract

* `src/data/vendoredSources.ts` — `VENDORED_SOURCES: { id, file, label }[]`, the full table above.
* `src/services/vendored.ts` — `SOURCES_PIN`, `sourcesBaseUrl()`, `fetchSourceDocument(id)`.
  * dev: `/sources/<file>` (served from the repo root by a Vite middleware, `vite.config.ts`)
  * prod: `https://cdn.jsdelivr.net/gh/sushruth/prakaram@<SOURCES_PIN>/sources/<file>`
  * Cache API store `prakaram-sources-v1`, keyed by pin + file. `SOURCES_PIN` is **computed at build
    time** by `vite.config.ts` as the last commit that touched `sources/`, so a refresh needs only
    commit + deploy — no manual bump. Set `VITE_SOURCES_PIN` to override (CI/deploy); with no git
    history it falls back to the build's own commit, then `'local'`.
* `src/services/adapters/vendoredAdapter.ts` — one generic adapter over `VENDORED_SOURCES`.

## Generator contract

* `scripts/sources/parsers/<name>.ts` — the pure `parse*` functions, moved out of `src/`.
* `scripts/sources/lib/{fetch,hash,provenance,manifest}.ts` — plain `fetch` (no proxy needed server-side), sha256, provenance helpers, manifest writer.
* `scripts/sources/generators/<name>.ts` — one per upstream; default-exports `{ id, run(): Promise<ManifestEntry[]> }` (or a named `generate`), fetches, parses, writes `sources/<docId>.json`.
* `scripts/sources/refresh.ts` — globs `generators/*.ts`, runs each, writes `manifest.json`. Run with `bun run sources:refresh`.

## Rules

1. **No proxy anywhere.** Build-time fetch is server-side and unrestricted; runtime fetch is jsDelivr/same-origin-dev only.
2. **No source text in the JS bundle.** `sources/` is not imported by `src/` and is not deployed with the app.
3. **Provenance is mandatory** on every generated file: upstream URL, ref, retrieval date, parser, licence, attribution, sha256.
4. **Swara is preserved exactly**; the half-letter-at-word-end spelling is kept as upstream prints it.
5. Unconfirmed-permission sources ship `metadata.status: 'draft'` (licence is a separate, ongoing task).
