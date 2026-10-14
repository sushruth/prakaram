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

## Vendored source text (`sources/`)

The app's live sources are compiled into `sources/` by `bun run sources:refresh` and served to the app from
jsDelivr at the commit `SOURCES_PIN` points at (`src/services/vendored.ts`). Parsing lives in `scripts/sources/`;
there is no proxy. Every processed file carries `metadata.provenance` and stays `status: "draft"` until proofread.
Three upstreams feed the 22 files.

### Ṛgveda — DharmicData (ODbL 1.0)

`sources/rigveda-1/index.json` … `sources/rigveda-10/index.json` (with their part files) are a Derivative
Database compiled from DharmicData, https://github.com/bhavykhatri/DharmicData, at commit
96b3bafd47ffbfe1902f3f0ef7a1928dd43c34d7.

> Contains information from DharmicData, which is made available here under the Open Database
> License (ODbL). https://opendatacommons.org/licenses/odbl/1-0/

These files are licensed to you under the ODbL 1.0. The licence text is included in this repository at
`sources/LICENSE-ODbL.txt`. The transformation applied to the upstream data (fetch → parse →
re-serialise into a MantraDocument) is the "alteration method" required by ODbL §4.6(b) and lives in
`scripts/sources/parsers/rigveda.ts` and `scripts/sources/generators/`. The text stays at
`status: "draft"` until it is proofread against a printed edition.

### Taittirīya Saṃhitā (kāṇḍa 4) and Āraṇyaka — taittiriya.com

`sources/taittiriya-samhita-4/` is compiled from the prashna pages at `taittiriya.com/samhita/kanda_4_prashna_<p>`, and
`sources/taittiriya-aranyaka-1/` … `-10/` from the prapāṭhaka pages at `taittiriya.com/aranyaka/prapathaka_<p>`. **Permission to reuse this text has not been confirmed**; the files stay
`status: "draft"`.

- Edited by Sridhar Iyer; the primary basis is the edition by Mullaivasal Sri Krishnamurthy Sastrigal (Madras Sanskrit College), per taittiriya.com/about.
- Source: https://taittiriya.com/ (Saṃhitā: `/samhita/`, Āraṇyaka: `/aranyaka/`)
- Licence: text from taittiriya.com; permission not yet confirmed.

### Śrī Sūkta (Ṛgveda Khila) — sanskritdocuments.org

`sources/rigveda-khila-sri.json` is compiled from the accented page `sanskritdocuments.org/doc_veda/s-sukta-accent.html`.
**Permission to reuse this text has not been confirmed**; the file stays `status: "draft"`.

- Encoded by Avinash Sathaye and Anant Upadhyayula, as named on the page.
- Source: https://sanskritdocuments.org/doc_veda/s-sukta-accent.html
- Licence: text from sanskritdocuments.org; permission not yet confirmed.
