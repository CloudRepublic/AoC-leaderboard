import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import type { Mock } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Config } from './config';
import { LeaderboardPoller } from './poller';

const SESSION = 'a1b2c3d4'.repeat(12);
const LEADERBOARD = { event: '2026', owner_id: 1, members: {} };

const ok = () =>
  new Response(JSON.stringify(LEADERBOARD), {
    headers: { 'content-type': 'application/json' },
  });

describe('LeaderboardPoller', () => {
  let config: Config;
  let fetchFn: ReturnType<typeof vi.fn>;
  type Log = (msg: string) => void;
  let log: { info: Mock<Log>; warn: Mock<Log>; error: Mock<Log> };
  let poller: LeaderboardPoller;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    vi.setSystemTime(new Date('2026-12-05T06:00:00Z'));
    config = {
      session: SESSION,
      leaderboardId: '123456',
      year: 2026,
      intervalS: 900,
      userAgent: 'test-agent',
      cacheFile: join(await mkdtemp(join(tmpdir(), 'aoc-')), 'cache.json'),
      staticDir: '',
      host: 'localhost',
      port: 0,
    };
    fetchFn = vi.fn(async () => ok());
    log = { info: vi.fn<Log>(), warn: vi.fn<Log>(), error: vi.fn<Log>() };
    poller = new LeaderboardPoller(config, fetchFn as typeof fetch, log);
  });

  afterEach(() => {
    poller.stop();
    vi.useRealTimers();
  });

  /** Runs due timers, then waits until the poll has rescheduled itself. */
  const settle = async (ms = 0) => {
    await vi.advanceTimersByTimeAsync(ms);
    await vi.waitFor(() => expect(vi.getTimerCount()).toBe(1));
  };

  it('fetches right away with the session cookie, then serves the data', async () => {
    await poller.start();
    await settle();
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(
      `https://adventofcode.com/2026/leaderboard/private/view/${config.leaderboardId}.json`,
    );
    expect(init.headers).toMatchObject({
      Cookie: `session=${SESSION}`,
      'User-Agent': 'test-agent',
    });
    expect(poller.snapshot).toEqual({
      data: LEADERBOARD,
      fetchedAt: expect.any(Number),
    });
  });

  it('never requests again within 15 minutes', async () => {
    await poller.start();
    await settle();
    await vi.advanceTimersByTimeAsync(899_000);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    await settle(1_000);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('honours the last attempt from before a restart', async () => {
    await writeFile(
      config.cacheFile,
      JSON.stringify({
        lastAttemptAt: Date.now() - 5 * 60_000,
        snapshot: { data: LEADERBOARD, fetchedAt: Date.now() - 5 * 60_000 },
      }),
    );
    await poller.start();
    expect(poller.snapshot?.data).toEqual(LEADERBOARD);
    await vi.advanceTimersByTimeAsync(9 * 60_000);
    expect(fetchFn).not.toHaveBeenCalled();
    await settle(60_000);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('counts failed attempts and explains an expired cookie', async () => {
    fetchFn.mockResolvedValue(new Response(null, { status: 302 }));
    await poller.start();
    await settle();
    expect(poller.snapshot).toBeUndefined();
    expect(log.error.mock.calls[0][0]).toMatch(
      /session cookie is probably expired/,
    );
    await vi.advanceTimersByTimeAsync(899_000);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('keeps serving the last data when a later request fails', async () => {
    await poller.start();
    await settle();
    fetchFn.mockRejectedValue(new Error('network down'));
    await settle(900_000);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(poller.snapshot?.data).toEqual(LEADERBOARD);
  });

  it('never writes the session cookie to the logs or the cache file', async () => {
    fetchFn.mockResolvedValueOnce(new Response('nope', { status: 400 }));
    await poller.start();
    await settle();
    const logged = JSON.stringify([log.info.mock.calls, log.error.mock.calls]);
    expect(logged).not.toContain(SESSION);
    expect(await readFile(config.cacheFile, 'utf8')).not.toContain(SESSION);
  });
});
