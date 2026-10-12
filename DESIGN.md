# DESIGN.md

> Visual direction for Parayanam. Read before changing any color, type, or chunk styling.

---

## 1. Direction

Parayanam is a chanting tool, not a temple. It should feel like a printed page on good paper, with the text doing all the work.

**We do not use:** saffron, maroon, temple gold, lotus or om ornaments, mandala backgrounds, gradients, glows, drop shadows on text, card borders around verses, or the serif-and-gold "devotional" look that most sites in this space share.

**We do use:** one ink color, one accent tint, generous space, opacity as the only hierarchy for lines, and type that is sharp at small sizes.

---

## 2. Principles

1. **One line is the focus.** The active chunk is fully opaque. Every other chunk is semi-transparent. No box, no background, no border, no scale, no glow around the active line.
2. **Opacity is the hierarchy.** Do not use size, weight, color, or boxes to mark the current line. Lines recede by opacity only.
3. **One accent.** Teal ink (`#1f5f63`) is used for the title, the instruction label, and focus states. Nothing else is colored.
4. **Tints, not fills.** Surfaces are paper neutrals. Where a fill is needed (a pressed pill), use a tint at most one step off the paper.
5. **No decoration.** No gradients, no glows, no blur except zen-mode dimming, no emoji in primary chrome.
6. **Motion is opacity only.** Transitions are 300–350 ms opacity fades. No scale, no slide.

---

## 3. Color Tokens

Defined on `:root` and `[data-theme="sandhya"]` (default) and `[data-theme="light"]` in `src/styles/theme.css`.

| Token | Value | Use |
| :--- | :--- | :--- |
| `--bg-base` | `#f7f7f5` | Page paper (default theme) |
| `--bg-card` | `#eeeeeb` | Pressed or hovered neutral |
| `--border-subtle` | `#e4e4e0` | Hairlines only |
| `--text-primary` | `#161614` | Active line, headings |
| `--text-secondary` | `#55554f` | Controls, inactive text |
| `--text-muted` | `#8c8c85` | Captions, subtitles |
| `--accent` | `#1f5f63` | Title, active control, focus |
| `--accent-light` | `#e6efef` | Selected-state tint |
| `--accent-gold` | `#a9cbc8` | Pulse hint for auto-progress (a tint, not gold) |

Dark theme keeps its own tokens and is not part of this direction yet. Do not add new hues. If a new state needs color, derive it from `--accent` at lower opacity.

---

## 4. Type

| Role | Face | Notes |
| :--- | :--- | :--- |
| UI and titles | Geist (400, 500, 600) | Titles at 600, tracking `-0.01em`. No uppercase except the instruction label. |
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

## 6. Translations

Translation lines are not shown under mantras. Do not reintroduce them as a default. The data stays in the corpus for future use.

---

## 7. Mobile

- Page gutter is 16 px.
- Header wraps; the icon row scrolls sideways rather than clipping.
- The control bar wraps onto rows. Nothing is hidden off-screen.
- Touch targets stay at 38 px minimum.

---

## 8. Checklist for a Design Change

- [ ] Does the active line still have no container?
- [ ] Are inactive lines still semi-transparent, and the active one fully opaque?
- [ ] Is there still only one accent hue?
- [ ] Are there no gradients, glows, or ornaments?
- [ ] Do Indic lines still render in sans-serif?
- [ ] Does it pass at 390 px wide with no horizontal page scroll?
