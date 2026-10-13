# Prompt for Gemini: turn one scanned edition into Prakaram data files

How to use: attach the scan (PDF or page images) of ONE edition, fill the four fields in the first block, paste the whole prompt, and run it once per chunk of pages (about 10 to 30 pages at a time works best). Save what it returns exactly as named and drop the files into the repo.

---

## Fill in

```
EDITION: Satyavrata Samasrami, Samaveda Samhita with Sayana, vol. 1 (1874)
PAGES (of the attached scan): 120 to 148
TEXT TO EXTRACT: the Samhita mantra text only (not Sayana's commentary, not notes, not the Latin or English front matter)
DOCUMENT ID PREFIX: sv-arc  (lowercase letters, digits, hyphens)
```

## Role

You are a careful digital editor of Vedic Sanskrit. You read page images and produce data files. You never fill a gap from memory, never "correct" a reading to what you think it should be, and never invent a numeral. If the page does not show it, you say so.

## The one rule that matters most

Transcribe what is printed on the page, mark, for mark. If a character or an accent mark is unclear, damaged or you are not sure, still write your best reading but list it in the review file (see "Review file"). Every doubtful mark must be listed. A confident wrong accent is worse than a flagged one.

## Output

Return exactly these files, each in its own fenced code block with the file name on the line above it. Nothing else except the short report at the end.

1. `<prefix>.json` (one file per hymn, sūkta or other natural unit; if the pages hold several, return several files, each named after its document id, e.g. `sv-arc-1-1-1.json`)
2. `<prefix>.review.md` (one review file for the whole run)

### JSON shape (this is the repo's own type, follow it exactly)

```json
{
  "id": "sv-arc-1-1-1",
  "title": {
    "sanskrit": "आग्नेयं काण्डम् — प्रथमः प्रपाठकः",
    "transliteration": "Āgneyaṃ kāṇḍam, prathamaḥ prapāṭhakaḥ",
    "english": "Agni book, first chapter"
  },
  "metadata": {
    "veda": "samaveda",
    "vedaNote": "Kauthuma Samaveda Samhita, as in Satyavrata Samasrami's edition",
    "source": "Satyavrata Samasrami (ed.), Samaveda Samhita with Sayana, vol. 1, Bibliotheca Indica, Calcutta, 1874, pp. 120-148. Page images transcribed by hand.",
    "license": "Public domain (published before 1931). Transcription dedicated to the public under CC0.",
    "status": "draft",
    "deity": "Agni",
    "categories": ["Samaveda", "Samhita"],
    "summary": "Two plain English sentences saying what this unit is and where it sits. No praise, no claims you cannot see on the page."
  },
  "sections": [
    {
      "id": "sv-arc-1-1-1-1",
      "title": "Anuvaka 1",
      "sectionNumber": 1,
      "chunks": [
        { "id": "sa-1-1", "chunkNumber": 1, "sanskrit": "अ॒ग्निमी॑ळे पु॒रोहि॑तं ।" },
        { "id": "sa-1-2", "chunkNumber": 2, "sanskrit": "य॒ज्ञस्य॑ दे॒वमृ॒त्विज॑म् ॥ १ ॥" }
      ]
    }
  ]
}
```

Rules for the JSON:

- **Valid JSON.** UTF-8, no comments, no trailing commas, no markdown inside strings.
- **`sections`** are the natural divisions the edition itself uses for this text (anuvāka, sūkta, adhyāya, khaṇḍa...). `sectionNumber` runs 1, 2, 3 with no gaps. If the unit has no sub-divisions, use one section. Use the edition's own division names in `title` (for example "Anuvaka 1"). Never use dotted citations or abbreviations such as "RV 1.1.1".
- **`chunks`** are the printed lines (pādas) in page order, one chunk per printed line, never merged or split across lines. `chunkNumber` runs 1, 2, 3 inside each section. Chunk `id` is `<2 to 4 letter code>-<section>-<chunk>`, unique in the file.
- **Verse numerals.** If the page prints a verse number at the end of a verse (`॥ १ ॥`, `॥ 12 ॥`), keep it at the end of that line exactly as printed, in the script printed. Do not add a numeral that is not printed, do not renumber, and do not move a numeral to another line.
- **`metadata.place`**: add it only if the edition's own page headings state the book and chapter numbers. Shape: `"place": { "work": { "sanskrit": "...", "english": "..." }, "divisions": [{ "kind": "maṇḍala", "n": 1 }] }`. Allowed `kind` values: kāṇḍa, prapāṭhaka, aṣṭaka, adhyāya, varga, anuvāka, maṇḍala, sūkta, praśna, khaṇḍa, valli. List outermost first and do not list the section itself. If you are not certain, leave `place` out.
- **No `translation` fields, no `rishi` or `chandas`** unless printed on the page for that unit. Do not add any English translation.
- **`veda`** is one of `rigveda`, `yajurveda`, `samaveda`, `atharvaveda`.

### Characters and accents

- Devanagari only, in Unicode, NFC form. Danda `।` (U+0964) and double danda `॥` (U+0965), with one space before them as in the examples.
- **Accents (svara).** Use these marks exactly:
  - udātta: unmarked (the syllable carries no mark)
  - anudātta: `॒` (U+0952), a short low bar under the syllable
  - svarita: `॑` (U+0951), a short mark above the syllable
  - dvi-mātra or dīrgha svarita (double upright mark above): `᳚` (U+1CDA)
- Place each mark directly after the letter it belongs to, after the vowel sign if there is one (`र॒`, `रु॒`). Never put a mark on a space or a danda.
- Keep the edition's accent system. If the page uses a different system (for example Sāmaveda numerals 1, 2, 3 above syllables, or Roth–Whitney's own signs), do **not** convert them silently. Write the text with whatever accent marks map cleanly to the four above, and list in the review file every place where the print uses a notation you could not map, quoting the page.
- Anusvāra is `ं`; keep `ग्ं` or `ँ` forms exactly as printed. Do not normalise spelling, sandhi, or conjuncts.
- If the page is in Roman letters (Aufrecht, Weber, Benfey, Whitney), transcribe the Roman text with its own accent marks into the same JSON fields, and set `metadata.vedaNote` to say "Roman transliteration, not yet converted". Do not convert to Devanagari yourself.

## Review file

`<prefix>.review.md` has one table with these columns, one row per doubtful place:

| File | Section | Chunk | Page | What the page shows | What I wrote | Why unsure |
| --- | --- | --- | --- | --- | --- | --- |

List a row for every:
- accent mark you could not see clearly or that two readings of the scan support,
- character that is damaged, faint, or could be two letters,
- place where the page and the running text seem to disagree (a repeated line, a missing verse number),
- notation you could not map to the four accent marks.

At the end add a heading `## Verse numerals` listing, per file, the first and last verse numeral printed and the count of verses, so a person can check no verse is missing.

## Short report (after the files)

Five lines at most: pages covered, number of files, number of chunks, number of review rows, and anything you skipped and why. Do not summarise the content.

## Do not

- Do not use any online text, memory, or another edition to fill or "repair" a line. Only the attached pages.
- Do not translate, explain, or add commentary.
- Do not merge two printed lines or split one printed line.
- Do not output a line you cannot see. If a page is missing, illegible or cut off, stop at that line and say so in the report.
- Do not change numerals from the form printed.
