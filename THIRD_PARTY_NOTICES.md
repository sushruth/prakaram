# Third-Party Notices

## Phosphor Icons

The flame mark (`src/components/FlameMark.tsx`, `public/favicon.svg`) uses Phosphor's `flame` outline path, with its own gradient and glow.


The icon paths in `src/icons/phosphor.ts` (regular weight) are vendored from
Phosphor Icons, licensed under the MIT License.

- Source: https://phosphoricons.com

### MIT License

Copyright (c) 2023 Phosphor Icons

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Sri Rudram, Namakam and Chamakam text

`src/data/rudramNamakam.json` and `src/data/rudramChamakam.json` were converted from the Kannada-script swara text published by Vignanam
(vignanam.org), supplied by the maintainer, using `scripts/kannadaToDocument.ts`. The Vedic text itself is ancient;
Vignanam's typed and proofread edition may carry rights. **Permission to reuse it has not been confirmed in writing.**
On 2026-10-13 the maintainer decided to reuse Vignanam as the sourcing source anyway and to open a discussion with
Vignanam (contact@vignanam.org) seeking formal permission and proposing that Prakaram's chanting features be offered
to Vignanam. Texts sourced from Vignanam stay at `status: "draft"` until that discussion concludes. New imports use
`scripts/vignanamToDocument.ts`, which fetches Vignanam's Devanagari pages; this repo's normalization conventions
(anusvara as ं, Devanagari digits in verse markers) are applied on import, since Vignanam prints ङ्/ञ् forms
and ASCII digits for the same text.

## Vendored source text (`sources/`)

The app's live sources are compiled into `sources/` by `bun run sources:refresh` and served to the app from
jsDelivr at the commit `SOURCES_PIN` points at (`src/services/vendored.ts`). Parsing lives in `scripts/sources/`;
there is no proxy. Every processed file carries `metadata.provenance` and stays `status: "draft"` until proofread.
Four upstreams feed the 22 files.

### Rigveda — DharmicData

`sources/rigveda-1.json` … `rigveda-10.json` are compiled from DharmicData (`bhavykhatri/DharmicData`), pinned to
commit `96b3bafd47ffbfe1902f3f0ef7a1928dd43c34d7` and fetched over jsDelivr (`cdn.jsdelivr.net`).

> Contains information from DharmicData, made available here under the Open Database License (ODbL).

- Source: https://github.com/bhavykhatri/DharmicData
- Licence: Open Database License (ODbL) 1.0, https://opendatacommons.org/licenses/odbl/1-0/
- The text stays at `status: "draft"` until it is proofread against a printed edition.

### Taittirīya Saṃhitā, kāṇḍa 4 — Wikisource

`sources/taittiriya-samhita-4.json` is compiled from the Sanskrit Wikisource page `तैत्तिरीयसंहिता-१-४` at
revid 417990.

- Source: https://sa.wikisource.org/w/index.php?title=%E0%A4%A4%E0%A5%88%E0%A4%A4%E0%A5%8D%E0%A4%A4%E0%A4%BF%E0%A4%B0%E0%A5%80%E0%A4%AF%E0%A4%B8%E0%A4%82%E0%A4%B9%E0%A4%BF%E0%A4%A4%E0%A4%BE-%E0%A5%A7-%E0%A5%AA&oldid=417990
- Licence: Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0), https://creativecommons.org/licenses/by-sa/4.0/
- The text stays at `status: "draft"` until it is proofread against a printed edition.

### Taittirīya Āraṇyaka — taittiriya.com

`sources/taittiriya-aranyaka-1.json` … `taittiriya-aranyaka-10.json` are compiled from the prapāṭhaka pages at
`taittiriya.com/aranyaka/prapathaka_<p>`. **Permission to reuse this text has not been confirmed**; the files stay
`status: "draft"`.

- Source: https://taittiriya.com/aranyaka/
- Licence: text from taittiriya.com; permission not yet confirmed.

### Śrī Sūkta (Ṛgveda Khila) — sanskritdocuments.org

`sources/rigveda-khila-sri.json` is compiled from the accented page `sanskritdocuments.org/doc_veda/s-sukta-accent.html`.
**Permission to reuse this text has not been confirmed**; the file stays `status: "draft"`.

- Source: https://sanskritdocuments.org/doc_veda/s-sukta-accent.html
- Licence: text from sanskritdocuments.org; permission not yet confirmed.
