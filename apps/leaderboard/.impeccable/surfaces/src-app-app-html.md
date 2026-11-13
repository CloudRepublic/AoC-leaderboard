---
version: 1
slug: 'src-app-app-html'
primary_target: 'src/app/app.html'
related_targets: ['src/app/app.css']
---

# Leaderboard wall screen

Scope: the single leaderboard screen (`apps/leaderboard`). Mode: Operate (a glanceable display, read from 2–5 m, no interaction).

Audience and job: Caesar colleagues see the standings, today's progress and the next unlock within seconds. Content: real AoC private leaderboard JSON. Constraints: 3840×2160 design canvas scaled to any player; logo file supplied by the user later.

## Direction contract

THESIS: The wall screen is the adventofcode.com private leaderboard itself, set as a monospace character grid at room scale. It refuses the dashboard arrangement of cards, panels, tinted rows and medal badges.

OWN-WORLD: AoC ground #0f0f23, body text #cccccc in Source Code Pro, green #00cc00 glowing title, white glowing emphasis, gold #ffff66 and silver #9999cc asterisk stars, #333366 for open days and #333340 for locked ones. No borders, no radius, no fills: structure comes from character columns and blank lines, headings as `--- Title ---`.

STORY: A passer-by recognises the AoC board, finds the leader and their own row, sees which stars fell today, and reads when the next puzzle opens.

FIRST VIEWPORT: Top left, "Advent of Code" in glowing green with the year line beneath; Caesar logo top right. Left half (fixed 1800px column): the private board with vertically stacked day digits over the star columns (today's digit in white glow), `N)` positions, right-aligned scores, asterisk stars, names, and a one-line star legend beneath. Only members with points are listed (at most 25 lines; beyond that the bottom of the ranking is cut), with a dim `+ N without points` / `+ N more players` line, or `No points yet · N players` before anyone scores. Right half, as plain AoC article text: the countdown, `--- Day N: fastest ---`, `--- Latest stars ---`, and a one-line status.

FORM: Pinned by the user ("move it strong towards the terminal style the real leaderboard uses"); the signature move is the board's literal character grid with vertical day digits, at wall scale. seed: none (direction pinned by user)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
