#!/usr/bin/env node
// Blocks commits that would publish the AoC session cookie, the private
// leaderboard (its id or concrete endpoint) or files that hold them.
//
//   node tools/check-secrets.mjs          check the staged changes (pre-commit hook)
//   node tools/check-secrets.mjs --all    check every tracked file (CI)
//
// Never prints a secret value, only where it was found.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const ENV_FILE = 'apps/leaderboard-server/.env';
const all = process.argv.includes('--all');

const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

/** Files that must never be committed, whatever they contain. */
const FORBIDDEN_PATHS = [
  [
    /(^|\/)\.env(\.(?!example$)[^/]+)?$/,
    'local .env file (holds your configuration)',
  ],
  [/(^|\/)secrets\//, 'file in secrets/'],
  [/\.session$/, '*.session file (session cookie)'],
  [
    /^\d+\.json$/,
    'AoC leaderboard dump (named after the private leaderboard id)',
  ],
  [/(^|\/)\.impeccable\/review\//, 'screenshot of the live board'],
];

const CONTENT_RULES = [
  [
    /\b[0-9a-f]{96,}\b/i,
    'a long hex string that looks like an AoC session cookie',
  ],
  [/session=[0-9a-f]{32,}/i, 'an AoC session cookie'],
  [
    /leaderboard\/private\/view\/\d+/,
    'a concrete private leaderboard endpoint',
  ],
];

/** This machine's own values, so they're caught even outside the patterns above. */
function localSecrets() {
  const env = { ...process.env };
  if (existsSync(ENV_FILE)) {
    for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
      if (m && !(m[1] in process.env)) env[m[1]] = m[2];
    }
  }
  const secrets = [];
  const id = env.AOC_LEADERBOARD_ID?.trim();
  if (id && id.length >= 4) secrets.push([id, 'your private leaderboard id']);
  let session = env.AOC_SESSION;
  if (!session && env.AOC_SESSION_FILE && existsSync(env.AOC_SESSION_FILE)) {
    session = readFileSync(env.AOC_SESSION_FILE, 'utf8');
  }
  session = session?.trim().replace(/^session=/, '');
  if (session && session.length >= 16)
    secrets.push([session, 'your session cookie']);
  return secrets;
}

const files = (
  all
    ? git('ls-files', '-z')
    : git('diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z')
)
  .split('\0')
  .filter(Boolean);

const secrets = localSecrets();
const problems = [];

for (const file of files) {
  const forbidden = FORBIDDEN_PATHS.find(([re]) => re.test(file));
  if (forbidden) {
    problems.push(`${file}: ${forbidden[1]}`);
    continue;
  }
  let content;
  try {
    // Staged content is what gets committed, not the working copy.
    content = all
      ? readFileSync(file, 'utf8')
      : execFileSync('git', ['show', `:${file}`], {
          encoding: 'utf8',
          maxBuffer: 64 * 1024 * 1024,
        });
  } catch {
    continue; // deleted in the working tree, or unreadable
  }
  if (content.includes('\0')) continue; // binary
  for (const [re, what] of CONTENT_RULES) {
    if (re.test(content)) problems.push(`${file}: contains ${what}`);
  }
  for (const [value, what] of secrets) {
    if (content.includes(value)) problems.push(`${file}: contains ${what}`);
  }
}

if (problems.length) {
  console.error(
    '\nSecret check failed: these would publish private AoC data:\n',
  );
  for (const p of problems) console.error(`  - ${p}`);
  console.error(
    '\nRemove them from the commit (git restore --staged <file>) and try again.\n',
  );
  process.exit(1);
}
