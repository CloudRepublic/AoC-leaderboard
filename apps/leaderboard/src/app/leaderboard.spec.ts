import {
  AocLeaderboard,
  AocMember,
  finishers,
  formatDuration,
  rankMembers,
  recentStars,
  unlockedDays,
  withoutOwner,
} from './leaderboard';

const DAY1 = 1_796_101_200;

const member = (
  id: number,
  name: string | null,
  score: number,
  days: Record<number, number[]> = {},
): AocMember => {
  const completion_day_level: AocMember['completion_day_level'] = {};
  let stars = 0;
  let last = 0;
  for (const [day, ts] of Object.entries(days)) {
    completion_day_level[day] = {};
    ts.forEach((t, i) => {
      completion_day_level[day][String(i + 1) as '1' | '2'] = {
        get_star_ts: t,
        star_index: 0,
      };
      stars++;
      last = Math.max(last, t);
    });
  }
  return {
    id,
    name,
    local_score: score,
    stars,
    last_star_ts: last,
    completion_day_level,
  };
};

const board = (...members: AocMember[]): AocLeaderboard => ({
  event: '2026',
  owner_id: 1,
  day1_ts: DAY1,
  num_days: 12,
  members: Object.fromEntries(members.map((m) => [m.id, m])),
});

describe('rankMembers', () => {
  it('ranks by score, shares rank on ties, earlier star wins tie order', () => {
    const rows = rankMembers(
      board(
        member(1, 'Late', 10, { 1: [DAY1 + 500] }),
        member(2, 'Top', 20, { 1: [DAY1 + 10, DAY1 + 20] }),
        member(3, 'Early', 10, { 1: [DAY1 + 100] }),
        member(4, null, 0),
      ),
    );
    expect(rows.map((r) => [r.rank, r.name])).toEqual([
      [1, 'Top'],
      [2, 'Early'],
      [2, 'Late'],
      [4, '(anonymous user #4)'],
    ]);
    expect(rows[0].days.slice(0, 2)).toEqual([2, 0]);
    expect(rows[0].days).toHaveLength(12);
  });
});

describe('recentStars', () => {
  it('returns newest stars first', () => {
    const lb = board(
      member(1, 'A', 0, { 1: [DAY1 + 1, DAY1 + 50] }),
      member(2, 'B', 0, { 2: [DAY1 + 86_400 + 5] }),
    );
    expect(recentStars(lb, 2)).toEqual([
      { name: 'B', day: 2, part: 1, ts: DAY1 + 86_405 },
      { name: 'A', day: 1, part: 2, ts: DAY1 + 50 },
    ]);
  });
});

describe('finishers', () => {
  it('lists two-star finishers by solve time since unlock', () => {
    const lb = board(
      member(1, 'Slow', 0, { 2: [DAY1 + 86_400 + 10, DAY1 + 86_400 + 900] }),
      member(2, 'Fast', 0, { 2: [DAY1 + 86_400 + 5, DAY1 + 86_400 + 300] }),
      member(3, 'Half', 0, { 2: [DAY1 + 86_400 + 1] }),
    );
    expect(finishers(lb, 2)).toEqual([
      { name: 'Fast', duration: 300 },
      { name: 'Slow', duration: 900 },
    ]);
  });
});

describe('unlockedDays', () => {
  it('counts unlocked puzzles, clamped to the event', () => {
    const lb = board();
    expect(unlockedDays(lb, DAY1 - 1)).toBe(0);
    expect(unlockedDays(lb, DAY1)).toBe(1);
    expect(unlockedDays(lb, DAY1 + 86_400 * 2 + 5)).toBe(3);
    expect(unlockedDays(lb, DAY1 + 86_400 * 40)).toBe(12);
  });
});

describe('formatDuration', () => {
  it('formats with optional days', () => {
    expect(formatDuration(3_725)).toBe('01:02:05');
    expect(formatDuration(90_061)).toBe('1d 01:01:01');
    expect(formatDuration(-5)).toBe('00:00:00');
  });
});

describe('withoutOwner', () => {
  it('drops the owner account and keeps everyone else', () => {
    const lb = {
      ...board(member(1, 'Owner', 0), member(2, 'Ada', 5)),
      owner_id: 1,
    };
    expect(Object.keys(withoutOwner(lb).members)).toEqual(['2']);
    expect(Object.keys(lb.members)).toHaveLength(2);
  });
});
