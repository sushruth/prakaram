# DESIGN.md

> Visual direction for Parayanam. Read before changing any color, type, or chunk styling.

---

## 1. Direction

Parayanam is a chanting tool, not a temple. It should feel like a printed page on good paper, with the text doing all the work.

**We do not use:** saffron, maroon, temple gold, lotus or om ornaments, mandala backgrounds, gradients, ambient glows (the flame glow is only for active controls), drop shadows on text, card borders around verses, or the serif-and-gold "devotional" look that most sites in this space share.

**We do use:** one ink color, one accent tint, generous space, opacity as the only hierarchy for lines, and type that is sharp at small sizes.

---

## 2. Principles

1. **One line is the focus.** The active chunk is fully opaque. Every other chunk is semi-transparent. No box, no background, no border, no scale, no glow around the active line.
2. **Opacity is the hierarchy.** Do not use size, weight, color, or boxes to mark the current line. Lines recede by opacity only.
3. **One accent.** Teal ink (`#1f5f63`) is used for active controls, focus, and the prakara title. Colour is reserved for the line-kind and swara tokens in §3 and §5c. Mantra text is plain ink.
4. **Tints, not fills.** Surfaces are paper neutrals. Where a fill is needed (a pressed pill), use a tint at most one step off the paper.
5. **No decoration.** No gradients, no glows, no blur except zen-mode dimming, no emoji in primary chrome.
6. **Motion is opacity only.** Transitions are 300–350 ms opacity fades. No scale, no slide.

---

## 3. Color Tokens

Defined on `:root` / `[data-theme="light"]` (light base) and `[data-theme="dark"]` in `src/styles/theme.css`. Theme choice is **System** (default; follows the OS), **Light**, or **Dark**. System removes the `data-theme` attribute so `prefers-color-scheme` decides.

| Token | Value | Use |
| :--- | :--- | :--- |
| `--bg-base` | `#f7f7f5` | Page paper (light) |
| `--bg-card` | `#eeeeeb` | Pressed or hovered neutral |
| `--scrim` | `rgba(247,247,245,.5)` | Half-strength cover behind drop panels |
| `--text-primary` | `#161614` | Active line, headings |
| `--text-secondary` | `#55554f` | Controls, inactive text |
| `--text-muted` | `#8c8c85` | Captions, subtitles |
| `--accent` | `#1f5f63` | Active control, focus, prakara title |
| `--swara-svarita` | `#4a45b8` | Syllable with svarita (U+0951) |
| `--swara-anudatta` | `#b0582c` | Syllable with anudatta (U+0952) |
| `--swara-dirgha` | `#9a7a10` | Syllable with dirgha svarita (U+1CDA) |
| `--shloka` | `#3d7a55` | Shloka lines (green tint) |
| `--vakya` | `#6e6c85` | Vakya lines (purplish grey) |
| `--flame-core/mid/tip` | blue, yellow, orange | Glow for active icons and choices (`--flame`) |
| `--accent-light` | `#e6efef` | Selected-state tint |
| `--accent-gold` | `#a9cbc8` | Pulse hint for auto-progress (a tint, not gold) |

Dark uses the same rules on a near-black paper (`#121413`), with the accent lifted to `#7fc4bf` for contrast. Text on accent fills uses `--on-accent` (white in light, near-black in dark), never a hardcoded white.

Do not add new hues. If a new state needs color, derive it from `--accent` at lower opacity.

---

## 4. Type

| Role | Face | Notes |
| :--- | :--- | :--- |
| UI and titles | Geist (400, 500, 600) | Titles at 600, tracking `-0.01em`. Uppercase only for small kind labels (Shloka, Vakya) and section captions. |
| Devanagari | Noto Sans Devanagari | Sans only. Serif Indic faces are not used. |
| Telugu, Kannada, Tamil, Malayalam | Noto Sans (matching script) | Same rules as Devanagari. |

**Font features.** Apply globally: `"kern"`, `"liga"`, `"calt"`. Indic text additionally uses `"mark"` and `"mkmk"` for correct combining marks (see `AGENTS.md` §3B for Tamil cluster order). Numeric readouts (BPM, confidence) should use `font-variant-numeric: tabular-nums` so they don't jitter while changing.

**Scale.** Verse text is user-controlled (A-/A+). Labels are 0.75–0.8 rem. Do not introduce a new size without need.

---

## 5. Chunk States

| State | Opacity | Container | Transform |
| :--- | :--- | :--- | :--- |
| Active | 1 | none | none |
| Inactive | 0.35 | none | none |
| Inactive, hovered | 0.6 | none | none |
| Zen, inactive | 0.18 + 0.4 px blur | none | none |

The instruction label ("Vakya / Procedure") is an uppercase teal label above the text. It has no fill.

---

## 5a. Reading Layout

The reader is a page, not a set of cards.

- Verse lines have 0.2 rem padding and 0.45 rem between lines. Do not add card padding or large gaps.
- Verse text line-height is 1.85.
- **Wrap** (on by default) wraps long lines. Off, each line stays on one row and scrolls sideways.
- **Split** (off by default) divides each verse at danda (`।`, `॥`), then breaks any phrase longer than 1.5× the median phrase length at the word nearest the median. The split happens in the data layer, so the active line, tap cadence, and auto-progress all agree with what is on screen.
- The instruction label appears on the first phrase of an instruction only.

## 5a. Header, Title and Flyouts

- The header is one vertically centred row: brand, prakara title, and icons.
- The prakara title is the centre of the header. It wraps to two lines and is limited to the akshara count of the longest default title, so it never widens the header. Tapping it opens the details flyout.
- The details flyout shows the Sanskrit title with its English note, the creator, the line count, the description, and the contents.
- Settings and details use the same drop panel. Only one is open at a time. Both are opaque, with no border or shadow, and the content behind them sits under `--scrim`.

## 5c. Line Kinds

| Kind | Looks like | Source |
| :--- | :--- | :--- |
| Mantra | Primary ink, regular weight. Each syllable carrying a swara mark takes its tone colour: svarita indigo, anudatta rust, dirgha ochre | Sukta line. Colour is per syllable, so conjuncts stay whole |
| Shloka | Green tint `--shloka`, medium weight, small "Shloka" label | Custom verse ending in `॥` |
| Vakya | Purplish grey `--vakya`, italic, small "Vakya" label | Other procedural text |

The swara and line-kind colours are provisional. Other kinds may get colours later; add them here first.

Only the first phrase of a split line carries the label.

## 5b. Cadence

The control bar has three labelled cadence modes. The mode is always visible; nothing is hidden behind an icon.

- **Off:** Tap or Space moves to the next line. Nothing is recorded.
- **Learn:** each tap is measured to learn your pace. Lines do not advance by themselves. A "Steadiness" readout shows how consistent your taps are.
- **Auto:** lines advance by themselves at the current tempo. Tempo is in matras per minute, so a long line takes longer than a short one.

Tempo is one slider, labelled Tempo, from 36 to 130. Learned tempo is clamped to the same range. Presets (Dhyāna, Abhyāsa, Pārāyaṇa) set the tempo directly.

## 6. Translations

Translation lines are not shown under mantras. Do not reintroduce them as a default. The data stays in the corpus for future use.

---

## 7. Mobile

- Page gutter is 16 px.
- Header is one row, vertically centred: brand on the left, four borderless icon buttons on the right (settings, prakara, room, zen). Active icons take the accent colour and the flame glow on the glyph, not a tint.
- Settings (script, text size, wrap, split, theme) drop down from behind the header on every screen size. Do not add settings to the header.
- The control bar wraps onto rows. Nothing is hidden off-screen.
- Touch targets stay at 38 px minimum.

---

## 7b. Surfaces, Borders and Buttons

Text first. The app is words on paper, and controls are words too.

- **No borders by default.** No element gets a border, outline ring or hairline divider unless this document names it as an exception.
- **Exceptions, explicit only:** keyboard focus ring (`:focus-visible`, 1 px accent), and the switch track in settings. Add any new exception here first.
- **Buttons are text.** A text button is accent-coloured words with no fill. Secondary text buttons are muted. Only icon buttons use a shape, and that shape is only the hit area.
- **Groups are rows of words.** Mode and option choices (Off / Learn / Auto, Dhyāna / Abhyāsa / Pārāyaṇa, System / Light / Dark) are text separated by space, not pills.
- **Active state is colour and glow.** The chosen word or icon takes the accent colour and the flame glow (`--flame`). No background tint, no outline.
- **The glow belongs to the glyph, never the box.** Icon buttons have no fill, tint, hover box or border in any state. The flame filter is applied to the icon's `svg`, so only the drawn shape glows. Never put `filter` on a button or a container.
- **Pressed state is a small scale-down and the flame glow on the icon.** No background change on press.
- **Surfaces are fills, not frames.** A panel is an opaque `--bg-base` surface with no border and no shadow. Content behind a flyout sits under the half-strength `--scrim`.
- **Separation is space**, not lines. Use spacing and type scale before adding any rule.

## 8. Checklist for a Design Change

- [ ] Are there no borders, outlines or pills (except the listed exceptions)?
- [ ] Is every button text, with the active state shown by accent colour and glow?
- [ ] Does the glow sit on the icon glyph (not on a button box), with no fill on any icon-button state?
- [ ] Does the active line still have no container?
- [ ] Are inactive lines still semi-transparent, and the active one fully opaque?
- [ ] Is there still only one accent hue?
- [ ] Are there no gradients, glows, or ornaments?
- [ ] Do Indic lines still render in sans-serif?
- [ ] Does it pass at 390 px wide with no horizontal page scroll?
