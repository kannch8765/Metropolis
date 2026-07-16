import { z } from 'zod';

export const resourceKindSchema = z.enum([
  'japanese_class',
  'consultation',
  'cultural_event',
  'community_space',
]);

export const resourceSchema = z.object({
  id: z.string().min(1),
  kind: resourceKindSchema,
  name: z.string().min(1),
  description: z.string().default(''),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  wardId: z.string().min(1),
  languages: z.array(z.string()).default([]),
  audiences: z.array(z.string()).default([]),
  accessibilityTags: z.array(z.string()).default([]),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  costType: z.enum(['free', 'paid', 'unknown']).optional(),
  sourceUrl: z.string().url(),
  sourceUpdatedAt: z.string(),
});

export type ResourceKind = z.infer<typeof resourceKindSchema>;
export type Resource = z.infer<typeof resourceSchema>;

export const wardMetricSchema = z.object({
  wardId: z.string(),
  resourceCount: z.number().int().nonnegative(),
  languageCount: z.number().int().nonnegative(),
  resourcesPerThousandForeignResidents: z.number().nonnegative().nullable(),
  computedAt: z.string().datetime(),
});

export type WardMetric = z.infer<typeof wardMetricSchema>;
