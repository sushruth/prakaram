# Contributing to Prakāram

Prakāram is built with Bun, Preact, TypeScript, Zustand, Trystero WebRTC and layered CSS.

## Documentation

* **[AGENTS.md](AGENTS.md)**: the operating manual and invariants for coding agents and humans alike. Read it first.
* **[ASSUMPTIONS.md](ASSUMPTIONS.md)**: architectural assumptions, Chandaḥ-śāstra formulas, Vedic accent encodings and the Panchangam roadmap.
* **[DESIGN.md](DESIGN.md)**: visual direction, tokens, cadence modes, and the Koshah wiki's routes and article anatomy.
* **[MAINTAINERS.md](MAINTAINERS.md)**: deployment to Cloudflare, the Worker and D1, and the handoff notes.
* **[sources/README.md](sources/README.md)**: how source text is fetched, parsed and vendored.
* **[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)**: the upstream editions and their licences.

## Run locally

You need [Bun](https://bun.sh) 1.3 or later.

```bash
bun install
bun run dev        # development server
bun test           # unit tests
bunx tsc --noEmit  # type check
bun run build      # production build
```

### Refresh the sources

Source text is compiled into `sources/` by generators under `scripts/sources/`. The Saswara Ṛgveda is read from a 741 MB submodule. It is marked `update = none`, so clones and the Cloudflare build skip it; fetch it by hand before a refresh:

```bash
git submodule update --init --checkout vendor/saswara-rigveda
bun run sources:refresh
SOURCES_ONLY=saswara-rigveda bun run sources:refresh   # one generator only
```

### Cloudflare Worker (optional backend)

```bash
cd worker
bunx wrangler dev
```

Passkey accounts are hidden. The UI entry point is not mounted, and the Worker's `/api/auth/*/verify` endpoints return `501` until WebAuthn verification is implemented.

## Project structure

```text
├── AGENTS.md              # Operating manual and invariants for coding agents
├── DESIGN.md              # Visual direction, tokens, borders and button rules
├── MAINTAINERS.md         # Deployment, Worker and D1 operations
├── ASSUMPTIONS.md         # Architectural and Vedic assumptions
├── THIRD_PARTY_NOTICES.md # Upstream editions and vendored assets
├── wrangler.jsonc         # Workers static-assets config (serves dist/)
├── sources/               # Vendored source text, IAST, fetched on demand from jsDelivr
├── scripts/sources/       # Generators and parsers that build sources/
├── vendor/                # Upstream submodules (the Saswara Ṛgveda)
├── src/
│   ├── App.tsx            # Shell: player or wiki by hash route, drop panels, modals
│   ├── components/        # Header, ZenMantraReader, cadence controls, settings,
│   │                      # Sanskrit (the one Sanskrit renderer), Wiki* pages
│   ├── config/themes.ts   # Theme ids, labels, data-theme attribute
│   ├── data/              # Default prakaras, the vendored-sources table, glossary
│   ├── icons/phosphor.ts  # Vendored Phosphor icon paths (MIT)
│   ├── services/          # Transliteration, cadence engine and state machine,
│   │                      # syllabifier, chunking, nirdeśa, wiki, URL codec, WebRTC room
│   ├── settings/          # Settings registry and controls
│   ├── stores/            # Zustand stores; persisted settings, cadence, prakaras, progress, basket
│   ├── styles/            # index.css entry; one file per concern and @layer
│   └── types/             # Shared TypeScript types
├── worker/                # Worker API (Hono), D1 schema and config
└── .github/workflows/ci.yml  # Typecheck, tests and build on push and PR
```
