import request from 'supertest';
import { createApp } from './app';

describe('GET /api/leaderboard.json', () => {
  it('answers 503 until the first fetch succeeded', async () => {
    const res = await request(createApp({ snapshot: undefined })).get(
      '/api/leaderboard.json',
    );
    expect(res.status).toBe(503);
  });

  it('serves the cached data with its fetch time as Last-Modified', async () => {
    const fetchedAt = Date.UTC(2026, 11, 5, 6, 15);
    const res = await request(
      createApp({ snapshot: { data: { members: {} }, fetchedAt } }),
    ).get('/api/leaderboard.json');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ members: {} });
    expect(res.headers['last-modified']).toBe(
      new Date(fetchedAt).toUTCString(),
    );
  });
});
