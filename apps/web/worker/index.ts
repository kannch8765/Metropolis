import type { Resource, ResourceKind, WardMetric } from '@metropolis/schema';

interface Env {
  DB?: D1Database;
  APP_ENV: string;
  AGENT_BASE_URL?: string;
}

type QueryAction = 'search_resources' | 'get_resource' | 'get_area_metrics' | 'compare_areas';
type QueryFilters = {
  id?: string;
  ids?: string[];
  ward_id?: string;
  language?: string;
  kind?: ResourceKind;
  limit?: number;
};

type ResourceRow = {
  id: string; kind: ResourceKind; name: string; description: string;
  latitude: number; longitude: number; ward_id: string;
  languages_json: string; audiences_json: string; accessibility_tags_json: string;
  start_at: string | null; end_at: string | null;
  cost_type: 'free' | 'paid' | 'unknown' | null;
  source_url: string; source_updated_at: string;
};

type MetricRow = {
  ward_id: string; resource_count: number; language_count: number;
  foreign_residents: number | null; resources_per_1000_foreign_residents: number | null;
  source_url: string | null; source_updated_at: string | null; computed_at: string;
};

const seedResources: Resource[] = [
  {
    id: 'itabashi-summer-japanese-open-class-2026',
    kind: 'japanese_class',
    name: '2026 Summer Japanese Open Classroom',
    description: 'Study one-to-one or in a small group with Japanese-language volunteers at Itabashi Green Hall, 3–22 August 2026. Advance reservation is required; fee is ¥200 per session.',
    latitude: 35.7509,
    longitude: 139.70514,
    wardId: 'itabashi',
    languages: ['ja'],
    audiences: ['japanese_learners', 'all_ages'],
    accessibilityTags: ['small_group', 'reservation_required'],
    startAt: '2026-08-03T09:00:00+09:00',
    endAt: '2026-08-22T16:30:00+09:00',
    costType: 'paid',
    sourceUrl: 'https://www.itabashi-ci.org/event/detail/4147',
    sourceUpdatedAt: '2026-07-18',
  },
  {
    id: 'itabashi-icief-japanese-class-2026',
    kind: 'japanese_class',
    name: 'ICIEF Beginner Japanese Classes',
    description: 'Six-month beginner Japanese courses with weekday morning and evening options, plus a Wednesday conversation salon. Classes are for people aged 15+ who live, work, or study in Itabashi.',
    latitude: 35.7509,
    longitude: 139.70514,
    wardId: 'itabashi',
    languages: ['ja'],
    audiences: ['foreign_residents', 'beginners', 'age_15_plus'],
    accessibilityTags: ['weekday', 'morning_or_evening'],
    costType: 'paid',
    sourceUrl: 'https://www.itabashi-ci.org/int/japanese-learning/fhjc/',
    sourceUpdatedAt: '2026-07-18',
  },
  {
    id: 'itabashi-culture-international-foundation',
    kind: 'community_space',
    name: 'Itabashi Culture and International Exchange Foundation',
    description: 'The foundation coordinates Japanese learning, international exchange, multilingual consultation information, and multicultural community programs in Itabashi.',
    latitude: 35.748889,
    longitude: 139.704444,
    wardId: 'itabashi',
    languages: ['ja', 'en', 'zh', 'ko', 'ne'],
    audiences: ['residents', 'foreign_residents', 'community_groups'],
    accessibilityTags: ['multilingual_web_information'],
    costType: 'unknown',
    sourceUrl: 'https://www.itabashi-ci.org/int/',
    sourceUpdatedAt: '2026-07-18',
  },
];

const json = (body: unknown, status = 200) => Response.json(body, {
  status,
  headers: { 'cache-control': 'no-store' },
});

const parseLimit = (value: string | null): number => {
  if (value === null) return 50;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 50;
};

const parseJsonArray = (value: string): string[] => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const toResource = (row: ResourceRow): Resource => ({
  id: row.id,
  kind: row.kind,
  name: row.name,
  description: row.description,
  latitude: row.latitude,
  longitude: row.longitude,
  wardId: row.ward_id,
  languages: parseJsonArray(row.languages_json),
  audiences: parseJsonArray(row.audiences_json),
  accessibilityTags: parseJsonArray(row.accessibility_tags_json),
  ...(row.start_at ? { startAt: row.start_at } : {}),
  ...(row.end_at ? { endAt: row.end_at } : {}),
  ...(row.cost_type ? { costType: row.cost_type } : {}),
  sourceUrl: row.source_url,
  sourceUpdatedAt: row.source_updated_at,
});

const toWardMetric = (row: MetricRow): WardMetric => ({
  wardId: row.ward_id,
  resourceCount: row.resource_count,
  languageCount: row.language_count,
  foreignResidents: row.foreign_residents,
  resourcesPerThousandForeignResidents: row.resources_per_1000_foreign_residents,
  sourceUrl: row.source_url,
  sourceUpdatedAt: row.source_updated_at,
  computedAt: row.computed_at,
});

async function searchResources(db: D1Database | undefined, filters: QueryFilters): Promise<Resource[]> {
  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 100);
  if (!db) {
    return seedResources
      .filter((resource) => !filters.ward_id || resource.wardId === filters.ward_id)
      .filter((resource) => !filters.kind || resource.kind === filters.kind)
      .filter((resource) => !filters.language || resource.languages.includes(filters.language))
      .slice(0, limit);
  }

  const clauses: string[] = [];
  const bindings: Array<string | number> = [];
  if (filters.ward_id) { clauses.push('ward_id = ?'); bindings.push(filters.ward_id); }
  if (filters.kind) { clauses.push('kind = ?'); bindings.push(filters.kind); }
  if (filters.language) {
    clauses.push("EXISTS (SELECT 1 FROM json_each(resources.languages_json) WHERE value = ?)");
    bindings.push(filters.language);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const result = await db.prepare(`SELECT * FROM resources ${where} ORDER BY name LIMIT ?`)
    .bind(...bindings, limit).all<ResourceRow>();
  return result.results.map(toResource);
}

async function getResource(db: D1Database | undefined, id: string | undefined): Promise<Resource | null> {
  if (!id) return null;
  if (!db) return seedResources.find((resource) => resource.id === id) ?? null;
  const row = await db.prepare('SELECT * FROM resources WHERE id = ? LIMIT 1').bind(id).first<ResourceRow>();
  return row ? toResource(row) : null;
}

async function getAreaMetrics(db: D1Database | undefined, wardIds: string[]): Promise<WardMetric[]> {
  if (!db || wardIds.length === 0) return [];
  const placeholders = wardIds.map(() => '?').join(', ');
  const result = await db.prepare(
    `SELECT d.ward_id, COUNT(r.id) AS resource_count, COUNT(DISTINCT je.value) AS language_count,
       d.foreign_residents,
       CASE WHEN d.foreign_residents > 0 THEN ROUND(COUNT(DISTINCT r.id) * 1000.0 / d.foreign_residents, 4) ELSE NULL END AS resources_per_1000_foreign_residents,
       d.source_url, d.reference_date AS source_updated_at,
       strftime('%Y-%m-%dT%H:%M:%SZ', 'now') AS computed_at
     FROM ward_demographics d
     LEFT JOIN resources r ON r.ward_id = d.ward_id
     LEFT JOIN json_each(COALESCE(r.languages_json, '[]')) je
     WHERE d.ward_id IN (${placeholders})
     GROUP BY d.ward_id, d.foreign_residents, d.source_url, d.reference_date
     ORDER BY d.ward_id`,
  ).bind(...wardIds).all<MetricRow>();
  return result.results.map(toWardMetric);
}

async function handleToolQuery(request: Request, env: Env): Promise<Response> {
  const payload = await request.json().catch(() => null) as { action?: QueryAction; filters?: QueryFilters } | null;
  if (!payload?.action) return json({ error: 'A supported action is required.' }, 400);
  const filters = payload.filters ?? {};
  if (payload.action === 'search_resources') return json({ resources: await searchResources(env.DB, filters) });
  if (payload.action === 'get_resource') return json({ resource: await getResource(env.DB, filters.id) });
  if (payload.action === 'get_area_metrics') return json({ metrics: await getAreaMetrics(env.DB, filters.ward_id ? [filters.ward_id] : []) });
  if (payload.action === 'compare_areas') return json({ metrics: await getAreaMetrics(env.DB, filters.ids?.slice(0, 10) ?? []) });
  return json({ error: 'Unsupported action.' }, 400);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/health') return json({ ok: true, environment: env.APP_ENV, database: Boolean(env.DB) });
    if (url.pathname === '/api/resources' && request.method === 'GET') {
      const resources = await searchResources(env.DB, {
        ward_id: url.searchParams.get('ward') ?? undefined,
        language: url.searchParams.get('language') ?? undefined,
        kind: (url.searchParams.get('kind') as ResourceKind | null) ?? undefined,
        limit: parseLimit(url.searchParams.get('limit')),
      });
      return json({ resources, source: env.DB ? 'd1' : 'verified_seed' });
    }
    if (url.pathname === '/api/tools/query' && request.method === 'POST') return handleToolQuery(request, env);
    if (url.pathname === '/api/agent/query' && request.method === 'POST') {
      if (!env.AGENT_BASE_URL) return json({ error: 'Agent service is not configured yet.' }, 503);
      return fetch(`${env.AGENT_BASE_URL}/query`, {
        method: 'POST',
        headers: { 'content-type': request.headers.get('content-type') ?? 'application/json' },
        body: await request.text(),
      });
    }
    return json({ error: 'Not found' }, 404);
  },
} satisfies ExportedHandler<Env>;
