# Licence compliance for redistributing the Prakaram corpus

**Scope.** Prakaram compiles upstream text into `sources/<id>/*.json` in the public repo
`sushruth/prakaram`, serves those files from jsDelivr (`cdn.jsdelivr.net/gh/sushruth/prakaram@<pin>/…`),
and renders them in the app with an attribution block (`metadata.provenance`: upstream URL, pinned ref,
retrieval date, licence, attribution string, sha256). This document records, for each upstream, what the
licence actually is (with the URL it was verified from), how our processed file is classified under that
licence, and exactly what we must do.

> **Not legal advice.** This is an engineering compliance plan built from the licence texts themselves.
> Two questions in particular are genuine legal judgment calls and are flagged for a lawyer's review:
> (a) whether our `sources/rigveda-*.json` is a *Derivative Database* or a *Produced Work* under the ODbL,
> and (b) whether a faithful transcription of an ancient, public-domain Vedic text attracts any new
> copyright in a modern publisher's edition. Where the answer is uncertain the plan takes the
> conservative position (comply with the stricter reading) and says so.

---

## 1. Summary table

| # | Upstream | Licence (verified, with the URL it was verified from) | Is our processed file an adaptation / derivative / produced work? | What we must do |
|---|----------|--------------------------------------------------------|------------------------------------------------------------------|-----------------|
| 1 | **DharmicData** `bhavykhatri/DharmicData`, commit `96b3bafd…`, Ṛgveda maṇḍalas 1–10 | **ODbL 1.0 — verified.** `LICENSE.txt` is the ODbL text [1]; README: "This dataset is made available under the Open Database License (ODbL)" [2] | **Derivative Database** (we Extract/Re-utilise a substantial part of the Contents into a new schema). Conservative reading; the Produced-Work reading is arguable — see §3 | Licence the `sources/rigveda-*.json` files under **ODbL 1.0**; carry the §4.3 notice with hyperlinks; keep notices intact; publish the alteration method (the parser) — see §2.1, §3 |
| 2 | **Wikisource** `sa.wikisource.org`, `तैत्तिरीयसंहिता-१-४`, revid 417990 | **CC BY-SA 4.0 — verified.** Wiki `rightsinfo`: "Creative Commons Attribution-Share Alike 4.0" [3]; Wikimedia ToU §7 licenses text under CC BY-SA 4.0 [4] | **Adapted Material** (restructured into sections/chunks + added metadata = more than a "technical modification necessary", so not exempted by CC BY-SA §2(a)(4) [5]) | Licence `sources/taittiriya-samhita-4.json` under **CC BY-SA 4.0**; carry full §3(a) attribution + §3(b) ShareAlike — see §2.2 |
| 3 | **taittiriya.com** `aranyaka/prapathaka_<p>`, prapāṭhakas 1–10 | **No licence stated — verified by absence.** Homepage footer [6], `/about` [7] and `/aranyaka/prapathaka_1` [8] contain no licence, copyright or terms statement | **All rights reserved by default.** No licence = no permission to redistribute | **Not compliant today.** Options in §5.1: seek written permission, replace from a public-domain edition, or remove. Recommend written permission + keep `draft` |
| 4 | **sanskritdocuments.org** `doc_veda/s-sukta-accent.html` (Śrī Sūkta) | **Restrictive terms — verified.** FAQ §"Can we copy contents…" [9]; site search page: "meant to be used for personal study and research. They are not to be copied or reposted … without permission" [10] | **Not permitted** as a public-repo redistribution | **Not compliant today.** Options in §5.2: replace with a PD-sourced Śrī Sūkta, or seek written permission, or remove |
| 5 | **Bundled `src/data` docs** — `shantiMantras`, `ganapatiPrarthana`, `purushaSuktam`, `sriSuktam`, `durgaSuktam`, `narayanaSuktam` | **No licence field at all** in metadata; `metadata.source` = "Saswara Veda Mantrah (Ramakrishna Math)". No public rights statement found for that edition | **Unclear / all rights reserved by default.** A recent printed edition is presumptively in copyright; a faithful transcription of a PD text may or may not attract new rights (lawyer question) | **Not compliant today.** Options in §5.3; keep `draft`; do not add a `license` field that implies permission we do not have |
| 5b | **Bundled `src/data` docs** — `rudramNamakam`, `rudramChamakam` (Vignanam) | **Permission being sought** — self-reported in `metadata.license`, `THIRD_PARTY_NOTICES.md`, `MAINTAINERS.md` §7 [11] | Same as above; Vignanam's typed edition may carry rights | Keep `status: draft`; conclude the Vignanam discussion in writing before promoting; `scripts/vignanamToDocument.ts` must not import new Vignanam text meanwhile |

Notes on the table:
- The licence **strings already in `manifest.json`** are close to correct for 1 and 2; the exact replacement
  strings are in §2.
- "Convey"/"Share" is triggered: serving the JSON from jsDelivr transfers a copy to the public, so ODbL
  §§4.2/4.4 and CC BY-SA §3 both apply. jsDelivr is a mirror of our repo; it does not change the analysis.

---

## 2. The exact strings to use

### 2.1 DharmicData (Ṛgveda, maṇḍalas 1–10)

**`metadata.provenance.license`** (replaces the current ODbL string):

```
ODbL 1.0 — Contains information from DharmicData (https://github.com/bhavykhatri/DharmicData),
which is made available here under the Open Database License (ODbL).
Licence text: https://opendatacommons.org/licenses/odbl/1-0/
```

**`metadata.provenance.attribution`** (one per maṇḍala, `N` = maṇḍala number):

```
Ṛgveda, maṇḍala N — DharmicData (https://github.com/bhavykhatri/DharmicData),
commit 96b3bafd47ffbfe1902f3f0ef7a1928dd43c34d7, ODbL 1.0
```

**`THIRD_PARTY_NOTICES.md` entry.** The ODbL §4.3 example notice is: *"Contains information from
DATABASE NAME, which is made available here under the Open Database License (ODbL)."* — with DATABASE NAME
replaced by the name of the database and a hyperlink to its URI, and "Open Database License" hyperlinked to
the licence URI [12]. Our notice should read:

```
### Ṛgveda — DharmicData (ODbL 1.0)

`sources/rigveda-1.json` … `sources/rigveda-10.json` are a Derivative Database compiled from
DharmicData, https://github.com/bhavykhatri/DharmicData, at commit
96b3bafd47ffbfe1902f3f0ef7a1928dd43c34d7.

Contains information from DharmicData, which is made available here under the Open Database
License (ODbL). https://opendatacommons.org/licenses/odbl/1-0/

These files are licensed to you under the ODbL 1.0. The licence text is included in this
repository at sources/LICENSE-ODbL.txt. The transformation applied to the upstream data
(fetch → parse → re-serialise into a MantraDocument) is the "alteration method" required by
ODbL §4.6(b) and lives in scripts/sources/parsers/rigveda.ts and scripts/sources/generators/.
```

**Per-directory licence file.** Add `sources/LICENSE-ODbL.txt` (a copy of the ODbL 1.0 text) and a short
header at the top of `sources/README.md` stating which files are ODbL. ODbL §4.2(b) requires a copy of the
licence **or its URI** with the Database/Derivative Database, "including both in the Database … and in any
relevant documentation" — the URI in each `provenance.license` plus `sources/LICENSE-ODbL.txt` satisfies
this.

### 2.2 Wikisource (Taittirīya Saṃhitā, kāṇḍa 4)

**`metadata.provenance.license`** (replaces the current CC BY-SA string):

```
CC BY-SA 4.0 — Adapted from "तैत्तिरीयसंहिता-१-४", Sanskrit Wikisource, revid 417990
(Wikisource contributors), used and licensed under CC BY-SA 4.0.
Licence text: https://creativecommons.org/licenses/by-sa/4.0/
```

**`metadata.provenance.attribution`**:

```
Taittirīya Saṃhitā, kāṇḍa 4 — Wikisource contributors,
"तैत्तिरीयसंहिता-१-४" revid 417990, CC BY-SA 4.0
```

**`THIRD_PARTY_NOTICES.md` entry.** Must satisfy CC BY-SA §3(a): keep the creator identification, a
copyright notice, a notice referring to the licence, a notice referring to the disclaimer of warranties, a
URI/hyperlink to the material, **indicate that we modified it**, and state the licence with a link to its
text [5]. Wikimedia ToU §7.4 accepts attribution "through hyperlink (where possible) or URL to the page …
you are reusing" [4]. Recommended entry:

```
### Taittirīya Saṃhitā, kāṇḍa 4 — Wikisource (CC BY-SA 4.0)

`sources/taittiriya-samhita-4.json` is adapted from "तैत्तिरीयसंहिता-१-४", Sanskrit Wikisource
(https://sa.wikisource.org/w/index.php?title=तैत्तिरीयसंहिता-१-४&oldid=417990), by Wikisource
contributors, retrieved 2026-10-14, and modified for this project (restructured into sections
and padas, metadata added, script normalised to NFC). The original is licensed under CC BY-SA
4.0; this adapted file is distributed under CC BY-SA 4.0.
Licence text: https://creativecommons.org/licenses/by-sa/4.0/
This material is provided without warranties of any kind; see §5 of the licence.
```

**Per-file/directory licence.** Add `sources/LICENSE-CC-BY-SA-4.0.txt` (the licence text) and list
`taittiriya-samhita-4.json` as CC BY-SA 4.0 in `sources/README.md`. CC BY-SA §3(b) requires the Adapter's
License to be "a Creative Commons license with the same License Elements" — i.e. CC BY-SA 4.0 (or later, or
a BY-SA-compatible licence) [5].

### 2.3 Unconfirmed sources — keep the current "permission not yet confirmed" strings

Until permission is granted, **do not** put a CC/ODbL licence string on these files. Keep:

```
taittiriya-aranyaka-*  license: "Text from taittiriya.com; permission not yet confirmed."
                       attribution: "Taittirīya Āraṇyaka, prapāṭhaka N — taittiriya.com"
rigveda-khila-sri      license: "Text from sanskritdocuments.org; permission not yet confirmed."
                       attribution: "Śrī Sūkta (Ṛgveda Khila 2.6) — sanskritdocuments.org"
```

and keep `metadata.status: "draft"` on all of them. If a file is removed (§5.1/§5.2), drop its
`VENDORED_SOURCES` entry and its `manifest.json` entry in the same commit.

---

## 3. ODbL specifics (DharmicData / `sources/rigveda-*.json`)

**Is our file a Derivative Database or a Produced Work?** Under the ODbL [12]:

- *Derivative Database* = "a database based upon the Database, and includes any translation, adaptation,
  arrangement, modification, or any other alteration … This includes … Extracting or Re-utilising the whole
  or a Substantial part of the Contents in a new Database."
- *Produced Work* = "a work (such as an image, audiovisual material, **text**, or sounds) resulting from
  using the whole or a Substantial part of the Contents (via a search or other query)."
- ODbL §4.5(b): "Using this Database … to create a Produced Work does not create a Derivative Database for
  purposes of Section 4.4."

The distinction matters: if our file is a **Derivative Database**, §4.4 Share-Alike forces it to be ODbL.
If it is a **Produced Work**, only the §4.3 notice applies and §4.4 does not. Two further clauses narrow
the gap:

- §4.4(c): "A Derivative Database is Publicly Used and so must comply with Section 4.4 if a Produced Work
  created from the Derivative Database is Publicly Used." So once any produced work is public, share-alike
  attaches to the derivative database anyway.
- §4.6: if you Publicly Use a Derivative Database **or a Produced Work from a Derivative Database**, you
  must offer recipients a machine-readable copy of the whole Derivative Database, or an alteration file.

**Our reading (conservative).** `sources/rigveda-*.json` are extracted from DharmicData and re-arranged
into our own schema — that is closer to "arrangement/modification … in a new Database" than to "a text
resulting from a query". **Treat them as a Derivative Database and licence them ODbL 1.0.** The files
themselves are the machine-readable derivative, so publishing them satisfies §4.6(a); the parser is the
alteration method for §4.6(b). **Flag for a lawyer:** a Produced-Work position is defensible and would let
the Rigveda files carry a different licence; the conservative choice costs nothing here because the app
code and the other `sources/` files stay under their own licences (see §4).

**What ODbL requires of us, clause by clause:**

| Clause | Requirement | How we meet it |
|---|---|---|
| §4.2(a) | Convey only under ODbL or a permitted licence | Rigveda files carry an ODbL notice |
| §4.2(b) | Include a copy of the licence **or its URI**, in the database **and** in documentation | URI in each `provenance.license`; `sources/LICENSE-ODbL.txt`; `THIRD_PARTY_NOTICES.md` |
| §4.2(c) | Keep intact any copyright / Database Right notices and licence notices | Preserve the notice; do not strip DharmicData's attribution |
| §4.2(d) | If notices can't go in a file, put them in a likely directory | `sources/README.md` + `sources/LICENSE-ODbL.txt` |
| §4.3 | If you Publicly Use a Produced Work, include the "Contains information from …" notice | NOTICE entry in §2.1; `provenance.attribution` on each file |
| §4.4 | Any Derivative Database you Publicly Use must be ODbL (or later/compatible) | Rigveda files are ODbL 1.0 |
| §4.5(d) | Do not add Contents that are incompatible with ODbL | Keep ODbL files separate from the CC BY-SA file; do not merge text from a source we cannot licence into the Rigveda files |
| §4.6 | Offer the derivative database or alteration file, free over the internet | The public repo + jsDelivr serve the derivative; the parser is the alteration method |
| §4.7 | Do not impose terms/technological measures that restrict the granted rights | No DRM on the JSON; do not add a "no-copy" notice to the Rigveda files |
| §2.4 | The licence does not cover rights in individual Contents | The underlying Ṛgveda is ancient/PD, so the database licence is what we are honouring |

**DharmicData's own upstream.** DharmicData's README credits the Rigveda text to the Vedic Heritage Portal
(`vedicheritage.gov.in`) [2]. Vedic Heritage Portal is a Government of India site; the captured
Copyright Policy is a standard "reproduce free of charge … source must be prominently acknowledged" policy
[13] — permissive, and the underlying Vedic text is public domain in any case. This does **not** change
what DharmicData's ODbL requires of us, but a maintainer should note it if the ODbL reading is ever
contested. *Uncertain: the VHP page was fetched via search snippet only (the site returns HTTP 403 to
direct fetch); confirm the current policy at `vedicheritage.gov.in` before relying on it.*

**The escape hatch.** Because the underlying Ṛgveda is public domain, we are not obliged to keep using
DharmicData. If ODbL share-alike on the repo is unacceptable, the alternative is to source the Rigveda
from a public-domain printed edition (e.g. Max Müller's 1873 Saṃhitā and Padapāṭha) under the plan already
in `MAINTAINERS.md` §7 — at which point the ODbL obligation disappears with the source.

---

## 4. CC BY-SA 4.0 specifics (Wikisource / `sources/taittiriya-samhita-4.json`)

**Is our file an adaptation or a collection?** CC BY-SA 4.0 does not use "Collection"; it uses *Adapted
Material* = "material … derived from or based upon the Licensed Material and in which the Licensed Material
is translated, altered, **arranged**, transformed, or otherwise modified in a manner requiring permission"
[5]. CC BY-SA §2(a)(4) exempts only "technical modifications necessary to exercise the Licensed Rights"
(e.g. format-shifting) — and says those "never produce Adapted Material" [5].

- Our JSON **restructures** the Wikisource text into sections/chunks, **adds** metadata, and **normalises**
  the script to NFC. That is arrangement/transformation, not a bare format-shift → **Adapted Material**.
  Therefore it **must be licensed CC BY-SA 4.0**.
- If a future version only format-shifted the text verbatim, it would arguably not be Adapted Material and
  could carry a different licence — but the conservative and current position is Adapted Material.

**Collection vs adaptation at the repo level.** The `sources/` directory as a whole is a *collection* of
independently-licensed texts (Rigveda under ODbL, TS 4 under CC BY-SA, the pending ones under "no
licence"). Per the CC FAQ: "All Creative Commons licenses … allow licensed material to be included in
collections … You may choose a license for the collection, however this does not change the license
applicable to the original material." [14] So the **repo as a whole does not become CC BY-SA**; only
`sources/taittiriya-samhita-4.json` (and any file derived from it) does.

**What CC BY-SA 4.0 requires of us:**

| Requirement (CC BY-SA 4.0) | How we meet it |
|---|---|
| §3(a)(1)(A) identification of the creator(s) | `provenance.attribution` names Wikisource contributors; NOTICE links the page |
| §3(a)(1)(B) a copyright notice | "© Wikisource contributors" (or the Wikimedia attribution-by-URL convention) |
| §3(a)(1)(C) a notice referring to the licence | `provenance.license` + NOTICE |
| §3(a)(1)(D) a notice referring to the disclaimer of warranties | NOTICE line "provided without warranties; see §5 of the licence" |
| §3(a)(1)(E) URI/hyperlink to the Licensed Material | NOTICE links the revid 417990 URL |
| §3(a)(2) indicate if modified, retain indication of previous modifications | NOTICE states the modifications made |
| §3(a)(3) indicate the licence + include text/URI of it | `provenance.license` + `sources/LICENSE-CC-BY-SA-4.0.txt` |
| §3(b)(1) Adapter's License must have the same elements (ShareAlike) | the file is licensed CC BY-SA 4.0 |
| §3(b)(2) include the Adapter's License text/URI | `sources/LICENSE-CC-BY-SA-4.0.txt` + URI in the file |
| §3(b)(3) no extra restrictions | no DRM / no additional terms on the JSON |

**Repo implications.** Because only one content file (plus its derivatives) must be CC BY-SA 4.0, use
**per-directory / per-file licensing**, not a repo-wide one:

- Add `sources/LICENSE-CC-BY-SA-4.0.txt` and `sources/LICENSE-ODbL.txt`.
- Add a short "Licences of files in this directory" table to `sources/README.md` mapping each file to its
  licence (ODbL for `rigveda-*`, CC BY-SA 4.0 for `taittiriya-samhita-4.json`, "unconfirmed" for the rest).
- Leave the **application code** (`src/`, `scripts/`, `worker/`) unlicensed by these content licences.
  There is currently **no root `LICENSE`** in the repo (verified: no `LICENSE*` file at the root, and no
  `license` field in `package.json`). If a code licence is added, it must not be applied to `sources/`.
- Do **not** put a single blanket licence at the repo root that would either (a) relicense the ODbL/CC BY-SA
  content incompatibly, or (b) imply the code is ODbL/CC BY-SA.

---

## 5. The two unconfirmed sources and the bundled docs

### 5.1 taittiriya.com (Taittirīya Āraṇyaka, prapāṭhakas 1–10)

**What is known (verified).** The homepage footer says the edition is "Edited and maintained by Sridhar
Iyer", with links to `/about`, `/reviewers`, `/become-a-reviewer` [6]. The `/about` page says the edition is
"free for anyone to read, recite and learn from" and names the primary basis as "Mullaivasal Sri
Krishnamurthy Sastrigal of Madras Sanskrit College" [7]. **No licence, copyright statement, or terms of
use appear on the homepage, `/about`, or `/aranyaka/prapathaka_1`** [6][7][8].

**What is assumed (and must not be treated as fact).** "Free to read" is a permission to read on the site;
it is **not** a licence to copy and redistribute the text. Absent a licence, the default in most
jurisdictions is that all rights are reserved. The underlying Taittirīya Āraṇyaka is ancient and in the
public domain; what could carry rights is Sridhar Iyer's specific edited, svara-marked digital edition
(authorial selection/arrangement/proofreading). Whether that attracts copyright is the lawyer question
noted in the header.

**Options:**

1. **Seek written permission (recommended).** Email Sridhar Iyer via the `/become-a-reviewer` form or the
   contact on `/about`. Draft in §6.1. Keep the files `draft` meanwhile. This is the highest-quality text
   and the maintainer already depends on it.
2. **Replace with our own typed text from a public-domain edition.** The Āraṇyaka is available in
   public-domain printed editions (e.g. the Ānandāśrama series; see `MAINTAINERS.md` §7). Higher cost, but
   it removes the dependency and aligns with the "fill the Vedas ourselves" plan.
3. **Remove** the ten files from `sources/` and `VENDORED_SOURCES` until 1 or 2 lands.

**Recommendation:** option 1 now (ask), with option 2 as the fallback if permission is refused or goes
unanswered. Do not promote `status` above `draft` before a written grant.

### 5.2 sanskritdocuments.org (Śrī Sūkta)

**What is known (verified).** The site's FAQ "About copying files and texts from sanskritdocuments.org
site" states the site is for "personal study and research", and lists what you "cannot use any contents …
if you intend to": "promote your own web-site, commercial or not", "to compile from various other voluntary
sources and thereby ask money from visitors", "to alter the references and promote it as your own", "not to
give link to the original" [9]. The site search page repeats: "They are not to be copied or reposted for
promotion of any website or individuals or for commercial purpose without permission." [10] The Śrī Sūkta
page itself carries only encoder credits ("Encoded and proofread by Avinash Sathaye, Shree, Anant
Upadhyula, Sunder Hattangadi") and no licence [15].

**Options:**

1. **Replace with a public-domain-sourced Śrī Sūkta (recommended).** The Śrī Sūkta is a *khila* of the
   Ṛgveda and appears in many public-domain editions (the sanskritdocuments page itself links public-domain
   scans on archive.org [15]). Re-typing from a PD edition is cheap for one short sūkta and removes the
   problem entirely.
2. **Seek written permission** from `sanskrit@cheerful.com` (§6.2). Given the site's stated stance, this is
   unlikely to succeed for a public repo.
3. **Remove** `rigveda-khila-sri.json` from `sources/`.

**Recommendation:** option 1. The FAQ's explicit "not to be copied or reposted … without permission" makes
continued redistribution non-compliant; the text is short enough to re-source from a PD edition.

### 5.3 Bundled `src/data` docs and the Vignanam path

**Ramakrishna Math docs (6).** `shantiMantras`, `ganapatiPrarthana`, `purushaSuktam`, `sriSuktam`,
`durgaSuktam`, `narayanaSuktam` all carry `metadata.source: "Saswara Veda Mantrah (Ramakrishna Math)"` and
**no `metadata.license` field at all** (verified in the repo). No public rights statement for that edition
was found. "Saswara Veda Mantrah" is a modern printed edition; a modern edition is presumptively in
copyright. Whether a faithful transcription of a public-domain mantra text attracts new rights is a lawyer
question.

**Vignanam docs (2).** `rudramNamakam`, `rudramChamakam` carry `status: "draft"` and a licence note saying
permission is being sought (maintainer decision 2026-10-13) [11]; `THIRD_PARTY_NOTICES.md` and
`MAINTAINERS.md` §7 both say permission is unconfirmed and a discussion with `contact@vignanam.org` is
open [11]. `scripts/vignanamToDocument.ts` fetches Vignanam's pages and is the import path for more such
text.

**Options (all seven bundled docs):**

1. **Seek written permission** from the publisher/author (Ramakrishna Math; Vignanam). Drafts in §6.3 and
   §6.4.
2. **Replace with our own text from a public-domain edition** as part of the "fill the Vedas ourselves"
   plan (`MAINTAINERS.md` §7). Recommended long term; it is the same work already planned for the Rudram.
3. **Remove** the documents until 1 or 2 lands.

**Recommendation:** keep all seven at `status: draft`; pursue option 1 in parallel with option 2. For the
two Vignanam docs, do not add further Vignanam-derived documents via `scripts/vignanamToDocument.ts` until
the discussion concludes in writing. Add a header comment to `scripts/vignanamToDocument.ts` (it already
has one) and a `MAINTAINERS.md` line that the script is gated on the written permission. Do **not** add a
`license` field to the six Ramakrishna Math docs that states or implies permission we do not have; the
absence of a licence is itself the accurate record.

---

## 6. Draft permission requests

### 6.1 To Sridhar Iyer (taittiriya.com)

> **Subject: Permission to reuse the Taittirīya Āraṇyaka text from taittiriya.com**
>
> Namaste, Sridhar,
>
> I maintain Prakaram (https://prakaram.sushruth.dev), a free, non-commercial Vedic chanting companion.
> It presents Vedic texts line by line with svara, with full attribution and a pinned link to the source.
>
> I would like to include the Taittirīya Āraṇyaka (prapāṭhakas 1–10) from your edition at
> taittiriya.com/aranyaka/prapathaka_<p>. My current build copies that text into a public GitHub repo and
> serves it from jsDelivr, which I realise is more than "reading on the site", so I am writing to ask
> first.
>
> Would you be willing to grant permission to redistribute this text, or to license it under a
> Creative Commons licence (e.g. CC BY-SA 4.0)? I will carry whatever attribution you ask for, including
> your name and a link to the exact page, and I will keep the text in step with your corrections. I am
> also happy to credit you as a source and to remove it immediately on request.
>
> If a licence is not something you want to grant, may I at least confirm whether the text may be reused
> at all? Thank you for the work you have put into this edition.
>
> With respect, [name], maintainer of Prakaram

### 6.2 To sanskritdocuments.org

> **Subject: Permission to reuse the Śrī Sūkta (s-sukta-accent.html)**
>
> Namaste,
>
> I maintain Prakaram, a free, non-commercial Vedic chanting companion. I would like to include the
> accented Śrī Sūkta from sanskritdocuments.org/doc_veda/s-sukta-accent.html in a public GitHub repo,
> served to the app with full attribution to your volunteers and a link to the page.
>
> Your FAQ asks that contents not be copied or reposted without permission, so I am writing to request
> permission for this specific text, or confirmation of a licence under which it may be reused. I will
> credit the encoders named on the page and link back to the original, and I will remove it on request.
>
> If you would prefer that the text not be reused this way, I will instead type the sūkta from a
> public-domain edition — I would just rather ask first. Thank you for maintaining the collection.
>
> With respect, [name], maintainer of Prakaram

### 6.3 To Ramakrishna Math (publisher of "Saswara Veda Mantrah")

> **Subject: Permission to reuse the Saswara Veda Mantrah text**
>
> Namaste,
>
> I maintain Prakaram, a free, non-commercial Vedic chanting companion. Several texts in it (the shānti
> mantras, Gaṇapati prārthanā, Puruṣa Sūkta, Śrī Sūkta, Durgā Sūkta and Nārāyaṇa Sūkta) were transcribed
> from the edition *Saswara Veda Mantrah* published by Ramakrishna Math. I would like to confirm the terms
> on which this text may be reused.
>
> May I have permission to redistribute these transcriptions in a public GitHub repo with attribution to
> the publisher and the edition? If a formal permission or a licence is required, I would be grateful to
> know how to obtain it. I will credit the edition exactly as you specify and remove the text on request.
>
> With respect, [name], maintainer of Prakaram

*(Address to the publisher's imprint page on the physical copy — the exact current contact is not
published online in a form I could verify.)*

### 6.4 To Vignanam (already opened; text to confirm in writing)

> **Subject: Permission to reuse Vignanam's Sri Rudram text — follow-up**
>
> Namaste,
>
> Following the discussion opened on 2026-10-13, I would like to confirm in writing the terms on which
> Prakaram may reuse Vignanam's Kannada-script Sri Rudram (Namakam and Chamakam) text. Prakaram is a free,
> non-commercial Vedic chanting companion; I am also happy to offer Prakaram's chanting features to
> Vignanam as discussed.
>
> Could you confirm whether permission is granted, and under what attribution and conditions? Until then
> the text stays marked "draft" and marked as permission-pending.
>
> With respect, [name], maintainer of Prakaram

---

## 7. What a maintainer must do — checklist

1. [ ] **Add `sources/LICENSE-ODbL.txt`** (ODbL 1.0 text) and **`sources/LICENSE-CC-BY-SA-4.0.txt`**
   (CC BY-SA 4.0 text).
2. [ ] **Update `sources/README.md`** with a "Licences of files in this directory" table (ODbL for
   `rigveda-*`; CC BY-SA 4.0 for `taittiriya-samhita-4.json`; "unconfirmed" for the rest).
3. [ ] **Update `metadata.provenance.license`/`attribution`** for the Rigveda and Wikisource generators
   (`scripts/sources/generators/`) to the exact strings in §2, then run `bun run sources:refresh`.
4. [ ] **Update `THIRD_PARTY_NOTICES.md`** with the ODbL notice (§2.1) and the CC BY-SA attribution +
   modification + warranty-disclaimer notice (§2.2).
5. [ ] **Keep all unconfirmed files `status: "draft"`** and keep their "permission not yet confirmed"
   strings.
6. [ ] **Send the permission requests** (§6.1–§6.4) and record the outcomes in `THIRD_PARTY_NOTICES.md`.
7. [ ] **Decide the Śrī Sūkta and Āraṇyaka fallbacks:** if permission is refused/unanswered, re-source from
   a public-domain edition or remove the files (and their `VENDORED_SOURCES`/`manifest.json` entries).
8. [ ] **Do not add a root `LICENSE`** that covers `sources/`; if a code licence is added, scope it to code
   and state explicitly that `sources/` is excluded.
9. [ ] **Gate `scripts/vignanamToDocument.ts`:** no new Vignanam-derived imports until the written
   permission lands.
10. [ ] **Ask a lawyer to confirm** (a) Derivative-Database vs Produced-Work for the Rigveda files, and
    (b) whether the Ramakrishna Math / taittiriya.com editions attract new rights in a transcription of a
    public-domain text.
11. [ ] **Re-pin `SOURCES_PIN`** after the licence-string changes land, so the app serves the corrected
    provenance.

---

## 8. Coverage status

**Checked directly (primary sources fetched and read):**
- `THIRD_PARTY_NOTICES.md`, `sources/README.md`, `sources/manifest.json`, `MAINTAINERS.md` §4a/§7,
  `AGENTS.md` §1b, all eight `src/data/*.json` metadata blocks, `scripts/vignanamToDocument.ts` (repo).
- DharmicData `LICENSE.txt` (= ODbL text) and `README.md` (ODbL statement) [1][2].
- `sa.wikisource.org` `rightsinfo` API (CC BY-SA 4.0) [3]; the revision API confirming revid 417990 is page
  `तैत्तिरीयसंहिता-१-४` (and 417991 is `तैत्तिरीयसंहिता-५-७`) [16].
- Wikimedia Foundation Terms of Use §7 [4].
- CC BY-SA 4.0 legal code §1–§4 [5]; CC FAQ (collections) [14].
- ODbL text §1–§10 [12]; Open Data Commons FAQ [17].
- taittiriya.com homepage, `/about`, `/aranyaka/prapathaka_1` (no licence found) [6][7][8].
- sanskritdocuments.org FAQ, copying page, search page, and the Śrī Sūkta page [9][10][15].
- Vedic Heritage Portal copyright policy (search snippet only) [13].

**Uncertain / not fully verified:**
- Whether `sources/rigveda-*.json` is a Derivative Database or a Produced Work under ODbL — argued, not
  settled (lawyer).
- Whether our TS-4 processing is Adapted Material — argued from the definitions; if it were a bare
  format-shift, §2(a)(4) would exempt it (not our current situation).
- The exact rights of the *Saswara Veda Mantrah* edition and of taittiriya.com's edited text — no public
  statement found; a lawyer's view is needed.
- The Vedic Heritage Portal policy was read from a search snippet (the site returned HTTP 403 to direct
  fetch); confirm at source before relying on it.
- The taittiriya.com `/reviewers` page is JavaScript-rendered and could not be read; `/about` and
  `/become-a-reviewer` were read and contain no licence.

**Could not complete:**
- Direct fetch of `vedicheritage.gov.in` (HTTP 403) and `taittiriya.com/reviewers` (JS-rendered).
- A verified public URL for the *Saswara Veda Mantrah* edition's rights statement (none found).

---

## 9. Sources

1. DharmicData `LICENSE.txt` (ODC Open Database License, ODbL) —
   https://raw.githubusercontent.com/bhavykhatri/DharmicData/master/LICENSE.txt
2. DharmicData README ("This dataset is made available under the Open Database License (ODbL)") —
   https://raw.githubusercontent.com/bhavykhatri/DharmicData/master/README.md
3. Sanskrit Wikisource `rightsinfo` API ("Creative Commons Attribution-Share Alike 4.0") —
   https://sa.wikisource.org/w/api.php?action=query&meta=siteinfo&siprop=rightsinfo&format=json
4. Wikimedia Foundation Terms of Use, §7 Licensing of Content —
   https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use
5. Creative Commons Attribution-ShareAlike 4.0 International, Legal Code —
   https://creativecommons.org/licenses/by-sa/4.0/legalcode.en
6. taittiriya.com home page (footer; no licence statement) — https://taittiriya.com/
7. taittiriya.com "About this edition" (no licence statement) — https://taittiriya.com/about
8. taittiriya.com `aranyaka/prapathaka_1` (no licence statement) — https://taittiriya.com/aranyaka/prapathaka_1
9. sanskritdocuments.org FAQ, "About copying files and texts" —
   https://sanskritdocuments.org/sanskritfaq.php#SECTION0003500
10. sanskritdocuments.org search page ("not to be copied or reposted … without permission") —
    https://sanskritdocuments.org/search/
11. Prakaram repo: `THIRD_PARTY_NOTICES.md` (Vignanam), `MAINTAINERS.md` §7, `src/data/rudram*.json` —
    local files
12. ODC Open Database License (ODbL) text —
    https://raw.githubusercontent.com/bhavykhatri/DharmicData/master/LICENSE.txt (and
    https://opendatacommons.org/licenses/odbl/1-0/)
13. Vedic Heritage Portal copyright policy (Government of India; read via search snippet) —
    https://vedicheritage.gov.in/
14. Creative Commons FAQ, "If I create a collection that includes a work offered under a CC license…" —
    https://creativecommons.org/faq/
15. sanskritdocuments.org Śrī Sūkta page (encoder credits; no licence) —
    https://sanskritdocuments.org/doc_veda/s-sukta-accent.html
16. Wikisource revision API, revids 417990/417991 —
    https://sa.wikisource.org/w/api.php?action=query&prop=revisions&revids=417990%7C417991&format=json
17. Open Data Commons FAQ — https://opendatacommons.org/faq/ and
    https://opendatacommons.org/faq/licenses/
