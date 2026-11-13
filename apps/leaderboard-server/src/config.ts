import { readFileSync, statSync } from 'node:fs';

/** AoC asks automated clients not to request more often than every 15 minutes. */
export const MIN_INTERVAL_S = 900;

export interface Config {
  /** Value of the adventofcode.com `session` cookie. Never log or expose it. */
  session: string;
  leaderboardId: string;
  year: number;
  intervalS: number;
  userAgent: string;
  cacheFile: string;
  staticDir: string;
  host: string;
  port: number;
}

export class ConfigError extends Error {}

/**
 * Reads the configuration from environment variables. The session cookie comes
 * from `AOC_SESSION_FILE` (preferred: a file only the server user can read) or
 * `AOC_SESSION`.
 */
export function readConfig(
  env: NodeJS.ProcessEnv,
  now = new Date(),
  warn: (msg: string) => void = console.warn,
): Config {
  const intervalS = Number(env.AOC_REFRESH_SECONDS ?? MIN_INTERVAL_S);
  if (!Number.isFinite(intervalS) || intervalS < MIN_INTERVAL_S) {
    throw new ConfigError(
      `AOC_REFRESH_SECONDS must be at least ${MIN_INTERVAL_S} (AoC's limit).`,
    );
  }
  return {
    session: readSession(env, warn),
    leaderboardId: readLeaderboardId(env),
    // Until June, the leaderboard people care about is last December's.
    year: Number(
      env.AOC_YEAR ??
        (now.getMonth() < 6 ? now.getFullYear() - 1 : now.getFullYear()),
    ),
    intervalS,
    userAgent:
      env.AOC_USER_AGENT ??
      'caesar-aoc-leaderboard (private leaderboard screen)',
    cacheFile: env.AOC_CACHE_FILE ?? 'tmp/leaderboard-server/cache.json',
    staticDir: env.STATIC_DIR ?? 'dist/apps/leaderboard/browser',
    host: env.HOST ?? 'localhost',
    port: Number(env.PORT ?? 4251),
  };
}

function readLeaderboardId(env: NodeJS.ProcessEnv) {
  // Not defaulted in code, so the private leaderboard never ends up in the repo.
  const id = env.AOC_LEADERBOARD_ID?.trim();
  if (!id || !/^\d+$/.test(id)) {
    throw new ConfigError(
      'Set AOC_LEADERBOARD_ID to the number of your private leaderboard.',
    );
  }
  return id;
}

function readSession(env: NodeJS.ProcessEnv, warn: (msg: string) => void) {
  let raw: string;
  if (env.AOC_SESSION_FILE) {
    const file = env.AOC_SESSION_FILE;
    try {
      // Group or world access to the secret is a configuration mistake.
      if (process.platform !== 'win32' && statSync(file).mode & 0o077) {
        warn(
          `${file} is readable by other users; restrict it with: chmod 600 ${file}`,
        );
      }
      raw = readFileSync(file, 'utf8');
    } catch {
      throw new ConfigError(`Can't read AOC_SESSION_FILE (${file}).`);
    }
  } else if (env.AOC_SESSION) {
    raw = env.AOC_SESSION;
  } else {
    throw new ConfigError(
      'No AoC session cookie configured. Set AOC_SESSION_FILE (recommended) or AOC_SESSION.',
    );
  }
  // Accept the bare value as well as a pasted `session=...` cookie.
  const session = raw.trim().replace(/^session=/, '');
  if (!/^[0-9a-f]{32,}$/i.test(session)) {
    throw new ConfigError(
      "The AoC session cookie doesn't look right: expected the hex value of the `session` cookie.",
    );
  }
  return session;
}
