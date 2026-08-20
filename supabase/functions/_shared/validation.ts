import { z } from 'https://esm.sh/zod@3.25.76';
import { AppError } from './errors.ts';
import { readJsonBody } from './http.ts';

const boundedText = (max: number) => z.string().trim().min(1).max(max);
const jsonObject = z.record(z.string(), z.unknown());
const uuid = z.string().uuid();

export const strategyRequestSchema = z.object({
  sourceData: jsonObject,
  brandKit: jsonObject.default({}),
  organizationId: uuid,
  campaignId: uuid,
  modelId: boundedText(160).optional(),
  thinkingLevel: z.enum(['low', 'medium', 'high']).default('medium'),
  idempotencyKey: boundedText(128).optional(),
}).strict();

export const copyRequestSchema = z.object({
  sourceData: jsonObject,
  strategy: jsonObject.default({}),
  brandKit: jsonObject.default({}),
  organizationId: uuid,
  campaignId: uuid,
  isFullKit: z.boolean().default(false),
  modelId: boundedText(160).optional(),
  thinkingLevel: z.enum(['low', 'medium', 'high']).default('medium'),
  idempotencyKey: boundedText(128).optional(),
}).strict();

export const critiqueRequestSchema = z.object({
  copy: jsonObject,
  sourceData: jsonObject.default({}),
  brandKit: jsonObject.default({}),
  organizationId: uuid,
  campaignId: uuid.optional(),
  modelId: boundedText(160).optional(),
}).strict();

export const imageRequestSchema = z.object({
  brief: z.object({
    purpose: z.enum(['hero', 'supporting', 'background', 'editorial', 'renovation_concept', 'neighborhood_lifestyle']).optional(),
    subject: boundedText(5000),
    composition: boundedText(3000).optional(),
    style: z.enum(['editorial_clean', 'architectural_photography', 'warm_natural_light', 'dusk_luxury', 'aerial_submarket', 'minimalist_luxury']).optional(),
    references: z.array(boundedText(120_000)).max(3).optional(),
    brandColors: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).max(12).optional(),
    constraints: boundedText(3000).optional(),
    qualityTier: boundedText(80).optional(),
    isConceptual: z.boolean().optional(),
    aspectRatio: z.enum(['1:1', '4:3', '4:5', '16:9', '9:16']).default('1:1'),
  }).strict(),
  provider: z.enum(['bfl', 'nvidia', 'gemini_image', 'openai_image']).default('bfl'),
  model: boundedText(160).optional(),
  organizationId: uuid,
  campaignId: uuid,
  idempotencyKey: boundedText(128).optional(),
}).strict();

export const healthRequestSchema = z.object({
  operation: z.literal('health').optional(),
  organizationId: uuid.optional(),
}).strict();

export async function parseBody<TSchema extends z.ZodTypeAny>(
  req: Request,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  const body = await readJsonBody(req);
  const result = schema.safeParse(body);
  if (!result.success) throw new AppError('invalid_request', 400, 'The request did not match the expected schema.');
  return result.data;
}

const stringArray = z.array(boundedText(2000)).min(1).max(20);
const platformCopy = z.object({
  headline: boundedText(500),
  body: boundedText(10000),
  cta: boundedText(500),
  characterCount: z.number().int().nonnegative(),
  hashtags: stringArray.optional(),
}).passthrough();

export const strategyOutputSchema = z.object({
  targetAudience: z.object({
    name: boundedText(500),
    description: boundedText(3000),
    painPoints: stringArray,
    motivations: stringArray,
  }).passthrough(),
  primaryObjective: boundedText(3000),
  coreAngle: boundedText(3000),
  valueProposition: boundedText(3000),
  keyHooks: stringArray,
  supportingEvidence: stringArray,
  ctaStrategy: boundedText(2000),
  suggestedPlatforms: z.array(boundedText(100)).min(1).max(10),
}).passthrough();

export const copyOutputSchema = z.object({
  headlines: stringArray,
  ctas: stringArray,
  facebook: platformCopy,
  instagram: platformCopy,
  linkedin: platformCopy,
  emailNewsletter: z.object({
    subjectLines: stringArray,
    previewText: boundedText(1000),
    bodyMarkdown: boundedText(15000),
    ctaButtonText: boundedText(500),
  }).passthrough(),
  videoScript: z.object({
    title: boundedText(500),
    durationSeconds: z.number().positive().max(900),
    targetFormat: z.literal('9:16 vertical reel'),
    hook: boundedText(2000),
    callToAction: boundedText(1000),
    scenes: z.array(z.object({
      timeframe: boundedText(100),
      visualDirection: boundedText(3000),
      spokenAudio: boundedText(3000),
      onScreenText: boundedText(2000),
    }).passthrough()).min(1).max(20),
  }).passthrough(),
}).passthrough();

export const fullKitOutputSchema = z.object({
  strategy: z.object({
    targetAudience: z.object({ name: boundedText(500), description: boundedText(3000) }).passthrough(),
    primaryObjective: boundedText(3000),
    coreAngle: boundedText(3000),
    keyHooks: stringArray,
    valueProposition: boundedText(3000),
    supportingEvidence: stringArray,
    ctaStrategy: boundedText(2000),
    suggestedPlatforms: z.array(boundedText(100)).min(1).max(10),
  }).passthrough(),
  copy: copyOutputSchema,
}).passthrough();
