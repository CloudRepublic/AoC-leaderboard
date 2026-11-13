import { chmod, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigError, readConfig } from './config';

const SESSION = 'abc123'.repeat(16);
const ID = { AOC_LEADERBOARD_ID: '123456' };

describe('readConfig', () => {
  const secretFile = async (content: string, mode = 0o600) => {
    const file = join(await mkdtemp(join(tmpdir(), 'aoc-')), 'session');
    await writeFile(file, content);
    await chmod(file, mode);
    return file;
  };

  it('reads the cookie from a file, accepting a pasted `session=` prefix', async () => {
    const warn = vi.fn();
    const file = await secretFile(`session=${SESSION}\n`);
    expect(
      readConfig({ ...ID, AOC_SESSION_FILE: file }, undefined, warn).session,
    ).toBe(SESSION);
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns when the secret file is readable by others', async () => {
    const warn = vi.fn();
    const file = await secretFile(SESSION, 0o644);
    readConfig({ ...ID, AOC_SESSION_FILE: file }, undefined, warn);
    expect(warn.mock.calls[0][0]).toMatch(/chmod 600/);
  });

  it('falls back to the AOC_SESSION variable', () => {
    expect(readConfig({ ...ID, AOC_SESSION: SESSION }).session).toBe(SESSION);
  });

  it('refuses to start without a leaderboard id', () => {
    expect(() => readConfig({ AOC_SESSION: SESSION })).toThrow(
      /AOC_LEADERBOARD_ID/,
    );
  });

  it('refuses to start without a valid cookie', () => {
    expect(() => readConfig(ID)).toThrow(ConfigError);
    expect(() => readConfig({ ...ID, AOC_SESSION: 'not a cookie' })).toThrow(
      /doesn't look right/,
    );
  });

  it('refuses a refresh interval below 15 minutes', () => {
    expect(() =>
      readConfig({ ...ID, AOC_SESSION: SESSION, AOC_REFRESH_SECONDS: '600' }),
    ).toThrow(/at least 900/);
    expect(
      readConfig({ ...ID, AOC_SESSION: SESSION, AOC_REFRESH_SECONDS: '1800' })
        .intervalS,
    ).toBe(1800);
  });

  it("defaults to this December's event from July, last December's before", () => {
    const env = { ...ID, AOC_SESSION: SESSION };
    expect(readConfig(env, new Date('2026-11-13')).year).toBe(2026);
    expect(readConfig(env, new Date('2027-01-10')).year).toBe(2026);
  });
});
