# Caesar Advent of Code leaderboard

A single-screen Angular app (`apps/leaderboard`) that shows the Caesar private
Advent of Code leaderboard on a 4K display (e.g. a Xibo _Webpage_ widget).
The layout is designed at 3840×2160 and scales to fit any screen size.

```bash
npx nx serve leaderboard     # dev server on http://localhost:4250
npx nx build leaderboard     # static output in dist/apps/leaderboard/browser
npx nx test leaderboard
```

## Test data

`apps/leaderboard/fixtures/fake-50.json` is a made-up finished event with 50 scoring
players, 6 without points and the owner account. Development builds include it:
run `npx nx serve leaderboard` and open http://localhost:4250/?src=fake-50.json.

## Data: the leaderboard server

`apps/leaderboard-server` is the only thing that talks to adventofcode.com. It
fetches the private leaderboard JSON with your session cookie **at most once
every 15 minutes** (AoC's rule), caches it, and serves it to the screen at
`/api/leaderboard.json`. In production it also serves the built screen, so one
process is all the Xibo player needs to point at.

- The 15-minute limit is enforced in code and can't be lowered:
  `AOC_REFRESH_SECONDS` only accepts 900 or more. Failed attempts count too.
  The time of the last attempt is saved to the cache file before each request,
  so restarts can't cause an early request.
- When AoC rejects the cookie (they last about a month), the server logs it and
  keeps serving the last data. The screen's footer turns red once the data is
  older than 45 minutes.
- The screen leaves the owner account (`owner_id`) off and only lists members
  with points; the others are counted.

### Configure the session cookie

1. In the browser, log in to adventofcode.com and copy the value of the
   `session` cookie (developer tools, Application/Storage, Cookies).
2. Put it in a file only you can read. `secrets/` and `*.session` are
   git-ignored:

   ```bash
   mkdir -p secrets
   pbpaste > secrets/aoc.session   # or paste it with an editor
   chmod 600 secrets/aoc.session
   ```

3. Point the server at it. For local runs, copy
   `apps/leaderboard-server/.env.example` to `apps/leaderboard-server/.env`
   (git-ignored, loaded by Nx). On a server, set the variable in the service
   definition or use your platform's secret store:

   ```bash
   AOC_SESSION_FILE=secrets/aoc.session
   AOC_LEADERBOARD_ID=<the number in your private leaderboard's URL>
   ```

   The leaderboard id is required and deliberately has no default in the code,
   so it never ends up in the repository.

`AOC_SESSION` (the value itself) also works but is less safe, because process
environments are easier to leak. The server warns at startup when the secret
file is readable by other users, refuses to start without a valid-looking
cookie, and never logs the cookie, writes it to the cache or sends it to the
browser.

Other settings (all optional) are listed in `apps/leaderboard-server/.env.example`.

### Run it

```bash
npx nx serve leaderboard-server   # API on http://localhost:4251
npx nx serve leaderboard          # screen on http://localhost:4250, /api is proxied
```

Production:

```bash
npx nx run-many -t build -p leaderboard leaderboard-server
HOST=0.0.0.0 PORT=8080 AOC_LEADERBOARD_ID=<id> AOC_SESSION_FILE=/run/secrets/aoc.session \
  node dist/apps/leaderboard-server/main.js
```

Run it from the workspace root, or set `STATIC_DIR` (the screen's
`dist/apps/leaderboard/browser` folder) and `AOC_CACHE_FILE` to absolute paths.
Point the Xibo webpage widget at `http://<host>:8080/`.

### Keeping private data out of git

The cookie, `.env` files, `secrets/`, leaderboard dumps (`<id>.json`) and design
review screenshots of the live board are git-ignored. On top of that, a
pre-commit check (`tools/check-secrets.mjs`, installed as a git hook by
`npm install`) blocks a commit that contains any of those files, something that
looks like a session cookie, a concrete private leaderboard URL, or your own
leaderboard id or cookie as configured in `apps/leaderboard-server/.env`. It
never prints the values it finds. CI runs the same check on every tracked file.

### Docker

The `Dockerfile` builds the screen and the server on Google's distroless
Node.js 24 image (`gcr.io/distroless/nodejs24-debian13:nonroot`): no shell or
package manager, running as the `nonroot` user (65532). The server is bundled
into a single file with its dependencies, and everything the project adds
(server, screen, data folder) goes into one layer of about 2 MB. Rebuild
regularly to pick up the base image's security updates.

```bash
docker build -t caesar-aoc-leaderboard .
docker run -d --name aoc-leaderboard -p 8080:8080 \
  -e AOC_LEADERBOARD_ID=<id> \
  -v aoc-cache:/app/data \
  -v "$PWD/secrets/aoc.session:/run/secrets/aoc_session:ro" \
  caesar-aoc-leaderboard
```

- Keep `/app/data` on a volume: it holds the cache and the time of the last AoC
  request, which is what keeps the 15-minute limit across container restarts.
- The cookie is mounted read-only at `/run/secrets/aoc_session` and never baked
  into the image (`.dockerignore` keeps `secrets/` and `.env` files out of the
  build context). On a Linux host the container user `65532` must be able to read
  it: `sudo chown 65532 secrets/aoc.session` (keep `chmod 600`).
- The other settings are environment variables, as above (`-e AOC_YEAR=2026`).

The screen can also read any other JSON with `?src=<url>` (the URL has to allow
CORS).
