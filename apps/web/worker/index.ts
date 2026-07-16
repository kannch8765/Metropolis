import type { Resource } from '@metropolis/schema';

interface Env {
  DB?: D1Database;
  APP_ENV: string;
  AGENT_BASE_URL?: string;
}

const seedResources: Resource[] = [
  {
    id: 'seed-japanese-class-01',
    kind: 'japanese_class',
    name: 'Beginner Japanese Conversation',
    description: 'Seed record used until the open-data pipeline is connected.',
    latitude: 35.6895,
    longitude: 139.6917,
    wardId: 'shinjuku',
    languages: ['ja', 'en', 'zh'],
    audiences: ['adults', 'beginners'],
    accessibilityTags: ['weekend', 'free'],
    sourceUrl: 'https://example.invalid/source',
    sourceUpdatedAt: '2026-07-17',
  },
  {
    id: 'seed-cultural-event-01',
    kind: 'cultural_event',
    name: 'Multicultural Community Festival',
    description: 'Seed event for the resident-facing map.',
    latitude: 35.6762,
    longitude: 139.6503,
    wardId: 'shibuya',
    languages: ['ja', 'en'],
    audiences: ['families'],
    accessibilityTags: ['child_friendly'],
    sourceUrl: 'https://example.invalid/source',
    sourceUpdatedAt: '2026-07-17',
  },
];

const json = (body: unknown, status = 200) => Response.json(body, {
  status,
  headers: { 'cache-control': 'no-store' },
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return json({ ok: true, environment: env.APP_ENV, database: Boolean(env.DB) });
    }

    if (url.pathname === '/api/resources' && request.method === 'GET') {
      // Replace the seed branch with a typed D1 repository after migration 0001 is applied.
      return json({ resources: seedResources, source: env.DB ? 'seed_pending_repository' : 'seed' });
    }

    if (url.pathname === '/api/agent/query' && request.method === 'POST') {
      if (!env.AGENT_BASE_URL) {
        return json({ error: 'Agent service is not configured yet.' }, 503);
      }
      return fetch(`${env.AGENT_BASE_URL}/query`, {
        method: 'POST',
        headers: { 'content-type': request.headers.get('content-type') ?? 'application/json' },
        body: await request.text(),
      });
    }

    return json({ error: 'Not found' }, 404);
  },
} satisfies ExportedHandler<Env>;
