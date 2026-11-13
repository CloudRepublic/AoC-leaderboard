#!/usr/bin/env tsx
// @nx-target-name: serve
import { createApp } from './app';
import { ConfigError, readConfig } from './config';
import { LeaderboardPoller } from './poller';

let config;
try {
  config = readConfig(process.env);
} catch (e) {
  if (!(e instanceof ConfigError)) throw e;
  console.error(`[config] ${e.message}`);
  process.exit(1);
}

const poller = new LeaderboardPoller(config);
const app = createApp(poller, config.staticDir);

const server = app.listen(config.port, config.host, async (error?: Error) => {
  if (error) {
    throw error;
  }
  console.log(`[ ready ] http://${config.host}:${config.port}`);
  console.log(`Polling ${poller.url}`);
  await poller.start();
  // Set when Nx waits for this server to be ready
  if (process.env.NX_READY_SIGNAL_SOCKET) {
    try {
      // Function keeps TypeScript and bundlers from rewriting or bundling the import
      const load = new Function('s', 'return import(s)') as (
        s: string,
      ) => Promise<{ emitReadySignal(server: unknown): boolean }>;
      (await load('@nx/js/ready-signal')).emitReadySignal(server);
    } catch {
      // @nx/js isn't installed
    }
  }
});

process.on('SIGTERM', () => {
  poller.stop();
  server.close(() => process.exit(0));
});
