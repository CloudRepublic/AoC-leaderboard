import express from 'express';
import { existsSync } from 'node:fs';
import { LeaderboardPoller } from './poller';

/** Serves the cached leaderboard and, when built, the screen itself. */
export function createApp(
  poller: Pick<LeaderboardPoller, 'snapshot'>,
  staticDir?: string,
) {
  const app = express();
  app.disable('x-powered-by');

  app.get('/api/leaderboard.json', (_req, res) => {
    const snapshot = poller.snapshot;
    if (!snapshot) {
      res.status(503).json({ error: 'No leaderboard data fetched yet.' });
      return;
    }
    res
      // The screen reads this to tell when the data went stale.
      .set('Last-Modified', new Date(snapshot.fetchedAt).toUTCString())
      .set('Cache-Control', 'no-cache')
      .json(snapshot.data);
  });

  if (staticDir && existsSync(staticDir)) {
    app.use(express.static(staticDir));
  }
  return app;
}
