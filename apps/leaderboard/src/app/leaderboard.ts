/** Shape of the AoC private leaderboard JSON API (`/leaderboard/private/view/<id>.json`). */
export interface AocLeaderboard {
  event: string;
  owner_id: number;
  day1_ts: number;
  num_days: number;
  members: Record<string, AocMember>;
}

export interface AocMember {
  id: number;
  name: string | null;
  stars: number;
  local_score: number;
  last_star_ts: number;
  completion_day_level: Record<
    string,
    Partial<Record<'1' | '2', { get_star_ts: number; star_index: number }>>
  >;
}

export interface Row {
  id: number;
  rank: number;
  name: string;
  score: number;
  stars: number;
  /** Stars earned per day (0, 1 or 2), index 0 = day 1. */
  days: number[];
}

export interface StarEvent {
  name: string;
  day: number;
  part: number;
  ts: number;
}

export interface Finisher {
  name: string;
  /** Seconds between puzzle unlock and the second star. */
  duration: number;
}

const DAY = 86_400;

export const memberName = (m: AocMember) =>
  m.name ?? `(anonymous user #${m.id})`;

export const unlockTs = (lb: AocLeaderboard, day: number) =>
  lb.day1_ts + (day - 1) * DAY;

/** The leaderboard owner account runs the competition but doesn't compete. */
export function withoutOwner(lb: AocLeaderboard): AocLeaderboard {
  const members = { ...lb.members };
  delete members[lb.owner_id];
  return { ...lb, members };
}

/** Members ranked like AoC: score, then who got there first. Equal scores share a rank. */
export function rankMembers(lb: AocLeaderboard): Row[] {
  const sorted = Object.values(lb.members).sort(
    (a, b) =>
      b.local_score - a.local_score ||
      b.stars - a.stars ||
      a.last_star_ts - b.last_star_ts ||
      memberName(a).localeCompare(memberName(b)),
  );
  const rows: Row[] = [];
  sorted.forEach((m, i) => {
    const prev = rows[i - 1];
    rows.push({
      id: m.id,
      rank: prev?.score === m.local_score ? prev.rank : i + 1,
      name: memberName(m),
      score: m.local_score,
      stars: m.stars,
      days: Array.from(
        { length: lb.num_days },
        (_, d) => Object.keys(m.completion_day_level[d + 1] ?? {}).length,
      ),
    });
  });
  return rows;
}

/** Most recent stars across all members, newest first. */
export function recentStars(lb: AocLeaderboard, limit: number): StarEvent[] {
  return Object.values(lb.members)
    .flatMap((m) =>
      Object.entries(m.completion_day_level).flatMap(([day, parts]) =>
        Object.entries(parts).map(([part, star]) => ({
          name: memberName(m),
          day: +day,
          part: +part,
          ts: star.get_star_ts,
        })),
      ),
    )
    .sort((a, b) => b.ts - a.ts)
    .slice(0, limit);
}

/** Members who completed both parts of `day`, fastest first. */
export function finishers(lb: AocLeaderboard, day: number): Finisher[] {
  const start = unlockTs(lb, day);
  return Object.values(lb.members)
    .flatMap((m) => {
      const star = m.completion_day_level[day]?.['2'];
      return star
        ? [{ name: memberName(m), duration: star.get_star_ts - start }]
        : [];
    })
    .sort((a, b) => a.duration - b.duration);
}

/** Number of puzzles unlocked at `now` (unix seconds). */
export function unlockedDays(lb: AocLeaderboard, now: number): number {
  const n = Math.floor((now - lb.day1_ts) / DAY) + 1;
  return Math.max(0, Math.min(lb.num_days, n));
}

/** Formats seconds as `1d 02:03:04` / `02:03:04`. */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const d = Math.floor(s / DAY);
  const hms = [Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
  return d > 0 ? `${d}d ${hms}` : hms;
}
