import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Config, MIN_INTERVAL_S } from './config';

export interface Snapshot {
  data: unknown;
  /** When the data was fetched from AoC (ms since epoch). */
  fetchedAt: number;
}

/** What survives a restart: the last attempt time keeps the rate limit honest. */
interface State {
  lastAttemptAt: number;
  snapshot?: Snapshot;
}

type Fetch = typeof fetch;

/**
 * Fetches the private leaderboard from adventofcode.com at most once every
 * `intervalS` seconds (never less than 15 minutes), including failed attempts
 * and across restarts.
 */
export class LeaderboardPoller {
  private state: State = { lastAttemptAt: 0 };
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly config: Config,
    private readonly fetchFn: Fetch = fetch,
    private readonly log: Pick<Console, 'info' | 'warn' | 'error'> = console,
  ) {}

  get url() {
    const { year, leaderboardId } = this.config;
    return `https://adventofcode.com/${year}/leaderboard/private/view/${leaderboardId}.json`;
  }

  get snapshot(): Snapshot | undefined {
    return this.state.snapshot;
  }

  async start() {
    this.state = await this.load();
    this.schedule();
  }

  stop() {
    clearTimeout(this.timer);
  }

  private get intervalMs() {
    return Math.max(this.config.intervalS, MIN_INTERVAL_S) * 1000;
  }

  private schedule() {
    const delay = Math.max(
      0,
      this.state.lastAttemptAt + this.intervalMs - Date.now(),
    );
    if (delay > 0) {
      this.log.info(
        `Next AoC request in ${Math.ceil(delay / 1000)}s (rate limit: one per ${this.intervalMs / 1000}s).`,
      );
    }
    this.timer = setTimeout(() => void this.poll(), delay);
  }

  private async poll() {
    // Last line of defence for the rate limit, whatever scheduled this call.
    if (Date.now() - this.state.lastAttemptAt < this.intervalMs) {
      this.schedule();
      return;
    }
    this.state.lastAttemptAt = Date.now();
    try {
      // Record the attempt before making it, so a crash mid-request still
      // counts. If it can't be recorded, skip the request: a restart could
      // otherwise request again too soon.
      await this.save();
      this.state.snapshot = {
        data: await this.request(),
        fetchedAt: Date.now(),
      };
      this.log.info('Fetched the AoC leaderboard.');
      await this.save();
    } catch (e) {
      this.log.error(`AoC request failed: ${(e as Error).message}`);
    } finally {
      this.schedule();
    }
  }

  private async request(): Promise<unknown> {
    const res = await this.fetchFn(this.url, {
      headers: {
        Cookie: `session=${this.config.session}`,
        'User-Agent': this.config.userAgent,
      },
      // AoC redirects to the HTML page when the session isn't accepted.
      redirect: 'manual',
      signal: AbortSignal.timeout(30_000),
    });
    const isJson = res.headers
      .get('content-type')
      ?.includes('application/json');
    if (res.status === 200 && isJson) {
      const data = (await res.json()) as { members?: unknown };
      if (data && typeof data.members === 'object') return data;
      throw new Error('the response is not a private leaderboard.');
    }
    if ((res.status >= 300 && res.status < 500) || res.status === 200) {
      throw new Error(
        `AoC answered ${res.status} without leaderboard data. The session cookie is probably expired (they last about a month) or has no access to leaderboard ${this.config.leaderboardId}; update it and restart.`,
      );
    }
    throw new Error(`AoC answered ${res.status} ${res.statusText}.`);
  }

  private async load(): Promise<State> {
    try {
      const state = JSON.parse(
        await readFile(this.config.cacheFile, 'utf8'),
      ) as State;
      return typeof state.lastAttemptAt === 'number'
        ? state
        : { lastAttemptAt: 0 };
    } catch {
      return { lastAttemptAt: 0 };
    }
  }

  /** Writes the state atomically; it never contains the session cookie. */
  private async save() {
    const file = this.config.cacheFile;
    await mkdir(dirname(file), { recursive: true });
    await writeFile(`${file}.tmp`, JSON.stringify(this.state));
    await rename(`${file}.tmp`, file);
  }
}
