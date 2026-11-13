---
name: Caesar AoC Leaderboard
description: The adventofcode.com private leaderboard, set as a monospace character grid at wall scale.
colors:
  bg: '#0f0f23'
  text: '#cccccc'
  dim: '#8a8a9e'
  white: '#ffffff'
  green: '#00cc00'
  link: '#009900'
  gold: '#ffff66'
  silver: '#9999cc'
  open: '#333366'
  locked: '#333340'
  error: '#ff5555'
typography:
  display:
    fontFamily: 'Source Code Pro, monospace'
    fontSize: '150px'
    fontWeight: 400
    lineHeight: 1.15
  headline:
    fontFamily: 'Source Code Pro, monospace'
    fontSize: '96px'
    fontWeight: 400
    lineHeight: 1.1
  title:
    fontFamily: 'Source Code Pro, monospace'
    fontSize: '80px'
    fontWeight: 400
    lineHeight: 1.3
  body:
    fontFamily: 'Source Code Pro, monospace'
    fontSize: '60px'
    fontWeight: 400
    lineHeight: 1.3
  label:
    fontFamily: 'Source Code Pro, monospace'
    fontSize: '40px'
    fontWeight: 400
    lineHeight: 1.3
rounded:
  none: '0px'
spacing:
  heading-gap: '20px'
  block-gap: '50px'
  section-gap: '70px'
  column-gap: '200px'
  stage-y: '80px'
  stage-x: '140px'
components:
  board-line:
    textColor: '{colors.text}'
    typography: '{typography.body}'
    height: '66px'
  section-heading:
    textColor: '{colors.white}'
    typography: '{typography.body}'
  countdown:
    textColor: '{colors.white}'
    typography: '{typography.display}'
  site-title:
    textColor: '{colors.green}'
    typography: '{typography.headline}'
  status-line:
    textColor: '{colors.dim}'
    typography: '{typography.label}'
  status-line-error:
    textColor: '{colors.error}'
    typography: '{typography.label}'
  screen-message:
    textColor: '{colors.dim}'
    typography: '{typography.title}'
---

# Design System: Caesar AoC Leaderboard

## Overview

**Creative North Star: "The Terminal on the Wall"**

The screen is the adventofcode.com private leaderboard, not a dashboard about it. Everything is set in one monospace face on the AoC night-navy ground, and all structure comes from character columns, blank lines and glowing text, the way AoC itself is built. A colleague who plays should recognise the board from across the room before reading a single name.

The surface is laid out on a fixed 3840×2160 canvas and scaled uniformly to whatever player runs it (1920×1080 halves everything). Density follows the data: only members with points are listed; rows size to at most 25 lines in view and longer lists scroll. There is no interaction; motion is limited to the ticking countdown, the board's slow scroll when it holds more than 25 lines, the CRT overlay's rolling band, and a faint flicker on the green title block (four brief dips to 82–92% opacity, 40–100 ms each, at uneven points in a 7 s loop). The whole stage sits under a CRT overlay: 3px dark scanlines every 6px (28% black), a vignette darkening the edges to 55% black, and a faint white band (3.5%) rolling top to bottom every 9 s, stopped under prefers-reduced-motion (as is the title flicker). The overlay never blocks legibility: text stays crisp at 4K and the scanlines soften into texture at 1080p. There is no chrome either: no borders, fills, cards, radius or badges.

**Key Characteristics:**

- One typeface (Source Code Pro 400/700), ligatures off, every column measured in `ch`.
- AoC's own palette: green glowing title, white glowing emphasis, gold and silver asterisk stars.
- Glow (text-shadow in the text's own colour) is the only depth.
- Structure from character columns, blank lines and `--- Title ---` headings.
- Fixed 4K canvas, scaled as a whole.

## Colors

The adventofcode.com palette, carried over value for value: a near-black navy ground, soft grey text, and colour reserved for meaning.

### Primary

- **Terminal Green** (green): the "Advent of Code" title and event line only, always with its own glow.
- **Link Green** (link): unlocked day digits above the star columns; also the text-selection background.

### Secondary

- **Star Gold** (gold): two-star days on the board, part-2 events in the feed, and the total-stars asterisk.
- **Star Silver** (silver): first-star-only days and part-1 events in the feed.

### Neutral

- **Night Navy** (bg): the only background. Nothing sits on a different surface.
- **Terminal Grey** (text): names, scores, positions, body lines.
- **Muted Lavender-Grey** (dim): secondary lines (timestamps, unlock time, legend, status line, overflow line, empty-state sentences).
- **Glow White** (white): emphasis: section headings, the countdown, today's day digit.
- **Open Navy** (open): asterisks for unlocked days not yet solved.
- **Locked Slate** (locked): asterisks and digits for days not yet unlocked.
- **Alert Red** (error): stale-data and unreadable-data messages only.

### Named Rules

**The Stars Carry Meaning Rule.** Gold means both stars, silver means first star only, open navy means unlocked but unsolved, locked slate means not yet available. These four colours are never used for anything else.

**The One Ground Rule.** Night Navy is the only fill on the screen. Hierarchy comes from text colour and glow, never from a tinted row or panel.

## Typography

**Display Font:** Source Code Pro (with monospace)
**Body Font:** Source Code Pro (with monospace)

**Character:** A single monospace face at room scale, so every column of positions, scores, stars and names lines up as on the AoC page. Ligatures are disabled to keep each glyph in its cell.

### Hierarchy

- **Display** (400, 150px, 1.15): the countdown or the team's total-stars figure, in Glow White.
- **Headline** (400, 96px, 1.1): "Advent of Code" and the event line, in Terminal Green with glow. The `{caesar:` and `}` wrapper of the event line sits at 60% opacity with a tighter 4px glow (AoC uses 33%, which turns muddy under the CRT scanlines).
- **Title** (400, 80px): full-screen loading and error messages.
- **Body** (400, 60px, 1.3): side-column text, section headings and feed lines. Board rows use `min(66px, 1660px / (rows + 2))` as row height with the font at 0.9 of it; star cells and day digits are set at 1.4em, weight 700.
- **Label** (400, 40px): the star legend and the status line, in Muted Lavender-Grey.

### Named Rules

**The Character Column Rule.** Columns are widths in `ch` (position 4ch right-aligned, score 6ch right-aligned, one-character gutters), never pixel tracks. Names take the remaining width and end in an ellipsis.

**The One Face Rule.** Source Code Pro is the only typeface. Hierarchy comes from size, colour and glow, not from a second family.

## Layout

A fixed 3840×2160 stage centred in the viewport and scaled to fit with one `--scale` factor. Padding is 80px top and bottom, 140px left and right. The header (title left, Caesar logo slot right, 160px tall) sits above a two-column grid: the board in a fixed 1800px column, then the side text in the remaining width, 200px apart. The side column stacks its sections 70px apart, with a 20px gap under each heading. The star legend is pushed to the bottom of the board column and the status line to the bottom of the side column. The latest-stars feed takes whatever height is left and clips; it never scrolls.

Board contents: the owner account (`owner_id`) is left off the screen entirely; every member with points is listed, members without points are counted on one dim `+ N without points` line (or `No points yet · N players` before anyone scores). Up to 25 lines are in view; a longer list scrolls inside a fixed window under the day digits on a 60-second loop (hold on the leaders ~7 s, ease down ~41 s, hold on the bottom ~7 s, glide back ~5 s), matching one Xibo rotation. While it scrolls, the window's edges fade out over 1.5 rows wherever rows are hidden: only the bottom while the leaders hold, both edges while moving, only the top while the bottom holds. This is the only motion on the screen besides the countdown.

## Elevation & Depth

Flat. There are no box shadows, layers or surfaces. The only depth is AoC's phosphor glow: a `text-shadow` in the text's own colour, tied to emphasis.

### Shadow Vocabulary

- **Title glow** (`text-shadow: 0 0 4px var(--green), 0 0 12px var(--green)`): the green title and event line.
- **Today glow** (`text-shadow: 0 0 8px var(--white)`): today's day digit.
- **Countdown glow** (`text-shadow: 0 0 10px var(--white)`): the display figure.
- **Heading glow** (`text-shadow: 0 0 6px var(--white)`): `--- Title ---` headings.

### Named Rules

**The Glow Is Emphasis Rule.** Glow is only for green title text and white emphasis text, always in the text's own colour. Body, dim, star and error text never glow.

## Shapes

No shapes. No borders, no radius, no fills, no dividers. Separation is whitespace and character alignment; the only "lines" are the `---` dashes inside headings and the `·` separators inside the legend and status line.

## Components

### Board Line

The signature row: `N)` position (4ch, right), score (6ch, right), one asterisk per day in its star colour (1.4em, bold), then the name with an ellipsis if it is too long. Above the rows, two lines of day digits (tens over units) align over the star columns: Locked Slate for future days, Link Green for unlocked days, Glow White with glow for today. The one-line legend at the bottom repeats the three star colours.

### Section Heading

AoC's own heading form: `--- Day N: fastest ---`, `--- Latest stars ---`, in Glow White with glow at body size.

### Countdown

A Terminal Grey body line ("Day N unlocks in"), the display figure, and a dim line with the unlock date. After the last unlock, the same slot shows the team's star total with a gold asterisk.

### Feed and Podium Lines

Character-column lines like the board: dim timestamp, coloured asterisk, `day N` (7ch), name. Podium lines: `N)` (3ch), time, name. Empty states are one dim sentence in place of the list.

### Status Line

One label-size dim line: player count · star count · update time. On stale or unreadable data it switches to Alert Red and says so plainly while the last good data stays on screen. With no data at all, a single title-size message sits in the middle of the stage.

### Logo Slot

The Caesar logo (`caesar-logo.svg`, 160px tall) sits top right and is removed when the file fails to load. The file is pending from the user, so the slot is currently empty.

## Do's and Don'ts

### Do:

- **Do** build every new piece of information as a line of character columns in Source Code Pro, widths in `ch`.
- **Do** use `--- Title ---` headings in Glow White for new sections.
- **Do** keep gold, silver, open navy and locked slate for star state only.
- **Do** lay out at 3840×2160 and let the single stage scale handle smaller players.
- **Do** state stale or missing data in Alert Red text, keeping the last good data visible.

### Don't:

- **Don't** add cards, panels, borders, rounded corners, tinted rows or background fills.
- **Don't** add medal badges, avatars or icons; the asterisk is the only mark.
- **Don't** introduce a second typeface or turn ligatures back on.
- **Don't** glow body, dim, star or error text.
- **Don't** scroll or animate content; overflow is clipped or summarised in a dim `+ N` line.
