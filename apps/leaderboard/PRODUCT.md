# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Caesar colleagues taking part in Advent of Code, plus anyone walking past. They read
the screen on an office wall from 2–5 m, at a glance, while passing or standing in a
common area. Nobody interacts with it.

## Product Purpose

Show the Caesar private Advent of Code leaderboard on a 4K wall screen
driven by Xibo, so the competition stays visible during December: who leads, who got
stars today, and when the next puzzle unlocks. Success: someone passing by can tell
the standings and today's progress within a few seconds.

## Positioning

It is the team's own AoC board, made to feel like the real adventofcode.com private
leaderboard, scaled for a wall instead of a laptop.

## Operating Context

- Runs unattended as a Xibo webpage widget on a 3840×2160 screen; it must also scale
  correctly to 1920×1080 players.
- Data is the AoC private leaderboard JSON, refreshed on the host at most every
  15 minutes (AoC rate limit); the page re-reads it every minute.
- The event runs 12 days (2026 format); puzzles unlock at 06:00 Amsterdam time.

## Capabilities and Constraints

- Ranked board with per-day star state, score and star totals for all members.
- Countdown to the next puzzle unlock.
- Fastest two-star solvers for the latest unlocked day.
- Feed of the most recent stars.
- Must keep working on stale data and show when the data can't be read.
- No interaction, no navigation: a display surface.

## Brand Commitments

- Visual style follows the real adventofcode.com private leaderboard (pinned by the
  user).
- The official Caesar logo appears on the screen. The file is not in the repo yet;
  the user provides it.

## Evidence on Hand

- The live leaderboard comes from the server; the repo holds only the synthetic
  `apps/leaderboard/fixtures/fake-50.json`. Real member data and the leaderboard id
  stay out of the repo.
- No Caesar logo file yet.

## Product Principles

- Legible from across the room beats showing more.
- Faithful to Advent of Code; anyone who plays should recognise it instantly.
- Never show invented data; stale or missing data is said plainly.
