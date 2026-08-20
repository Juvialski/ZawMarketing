// Authenticated, server-owned investment presentation deck generation.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { AppError, ProviderError, providerAppError } from '../_shared/errors.ts';
import { assertOrganizationAccess, authenticate } from '../_shared/auth.ts';
import { claimGeneration, finishGeneration } from '../_shared/usage.ts';
import { generateGeminiJson } from '../_shared/gemini.ts';
import { assertGeminiTextModel, geminiTextIsPaid, GEMINI_TEXT_MODELS } from '../_shared/providers.ts';
import { handleOptions, ensurePost, errorResponse, idempotencyKey, jsonResponse } from '../_shared/http.ts';
import { parseBody, presentationRequestSchema } from '../_shared/validation.ts';

const presentationResponseJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['schemaVersion', 'id', 'campaignId', 'title', 'subtitle', 'generatedAt', 'isDemo', 'theme', 'slides'],
  properties: {
    schemaVersion: { type: 'string' },
    id: { type: 'string' },
    campaignId: { type: 'string' },
    title: { type: 'string' },
    subtitle: { type: 'string' },
    generatedAt: { type: 'string' },
    isDemo: { type: 'boolean' },
    theme: {
      type: 'object',
      additionalProperties: false,
      required: ['mode', 'colors', 'typography', 'radii'],
      properties: {
        mode: { type: 'string', enum: ['dark', 'light'] },
        colors: {
          type: 'object',
          additionalProperties: false,
          required: ['background', 'surface', 'surfaceHighlight', 'foreground', 'foregroundMuted', 'foregroundFaint', 'border', 'borderFaint', 'primary', 'accentGradient', 'accentText'],
          properties: {
            background: { type: 'string' },
            surface: { type: 'string' },
            surfaceHighlight: { type: 'string' },
            foreground: { type: 'string' },
            foregroundMuted: { type: 'string' },
            foregroundFaint: { type: 'string' },
            border: { type: 'string' },
            borderFaint: { type: 'string' },
            primary: { type: 'string' },
            accentGradient: { type: 'string' },
            accentText: { type: 'string' },
          },
        },
        typography: {
          type: 'object',
          additionalProperties: false,
          required: ['headingFont', 'bodyFont', 'monoFont'],
          properties: {
            headingFont: { type: 'string' },
            bodyFont: { type: 'string' },
            monoFont: { type: 'string' },
          },
        },
        radii: {
          type: 'object',
          additionalProperties: false,
          required: ['sm', 'md', 'lg'],
          properties: {
            sm: { type: 'string' },
            md: { type: 'string' },
            lg: { type: 'string' },
          },
        },
      },
    },
    slides: {
      type: 'array',
      minItems: 6,
      maxItems: 20,
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: {
            type: 'string',
            enum: [
              'cover',
              'executive_summary',
              'property_overview',
              'investment_thesis',
              'stat_grid',
              'big_number',
              'financial_snapshot',
              'market_context',
              'timeline',
              'gallery',
              'target_audience',
              'marketing_strategy',
              'creative_showcase',
              'video_concept',
              'comparison',
              'table',
              'risk_disclaimer',
              'next_steps',
            ],
          },
          navLabel: { type: 'string' },
          speakerNotes: { type: 'string' },
          isHidden: { type: 'boolean' },
          kicker: { type: 'string' },
          title: { type: 'string' },
          subtitle: { type: 'string' },
          foot: { type: 'string' },
          imageUrl: { type: 'string' },
          summary: { type: 'string' },
          highlights: { type: 'array', items: { type: 'string' } },
          address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          zipCode: { type: 'string' },
          propertyType: { type: 'string' },
          bedrooms: { type: 'number' },
          bathrooms: { type: 'number' },
          squareFeet: { type: 'number' },
          yearBuilt: { type: 'number' },
          thesis: { type: 'string' },
          pillars: { type: 'array', items: { type: 'string' } },
          value: { type: 'string' },
          caption: { type: 'string' },
          factKey: { type: 'string' },
          stats: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                value: { type: 'string' },
                caption: { type: 'string' },
                factKey: { type: 'string' },
              },
            },
          },
          metrics: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                value: { type: 'string' },
                subtext: { type: 'string' },
                factKey: { type: 'string' },
                highlight: { type: 'boolean' },
              },
            },
          },
          disclosures: { type: 'array', items: { type: 'string' } },
          submarket: { type: 'string' },
          insights: { type: 'array', items: { type: 'string' } },
          comps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                address: { type: 'string' },
                price: { type: 'string' },
                sqft: { type: 'string' },
                notes: { type: 'string' },
              },
            },
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                time: { type: 'string' },
                title: { type: 'string' },
                body: { type: 'string' },
                imageUrl: { type: 'string' },
                caption: { type: 'string' },
                span: { type: 'number' },
              },
            },
          },
          audienceName: { type: 'string' },
          description: { type: 'string' },
          painPoints: { type: 'array', items: { type: 'string' } },
          motivations: { type: 'array', items: { type: 'string' } },
          coreAngle: { type: 'string' },
          hooks: { type: 'array', items: { type: 'string' } },
          platforms: { type: 'array', items: { type: 'string' } },
          cta: { type: 'string' },
          previewFormats: { type: 'array', items: { type: 'string' } },
          hook: { type: 'string' },
          durationSeconds: { type: 'number' },
          scenes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                timeframe: { type: 'string' },
                visualDirection: { type: 'string' },
                spokenAudio: { type: 'string' },
                onScreenText: { type: 'string' },
              },
            },
          },
          headers: { type: 'array', items: { type: 'string' } },
          rows: { type: 'array', items: { type: 'object' } },
          columns: { type: 'array', items: { type: 'string' } },
          highlightCol: { type: 'number' },
          highlightRow: { type: 'number' },
          disclaimerText: { type: 'string' },
          additionalCaveats: { type: 'array', items: { type: 'string' } },
          ctaText: { type: 'string' },
          contactInfo: {
            type: 'object',
            properties: {
              company: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              phone: { type: 'string' },
              website: { type: 'string' },
              licenseNumber: { type: 'string' },
            },
          },
        },
        required: ['id', 'type'],
      },
    },
  },
};

serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  try {
    ensurePost(req);
    const auth = await authenticate(req);
    const body = await parseBody(req, presentationRequestSchema);

    await assertOrganizationAccess(auth.userId, body.organizationId);

    const modelId = assertGeminiTextModel(body.modelId || 'gemini-3.5-flash-lite');
    const isPaid = geminiTextIsPaid(modelId);

    const claim = await claimGeneration({
      organizationId: body.organizationId,
      campaignId: body.campaignId,
      operation: 'presentation_deck',
      model: modelId,
      isPaid,
      idempotencyKey: idempotencyKey(req, body.idempotencyKey),
    });

    if (claim.cachedResponse) {
      return jsonResponse(claim.cachedResponse);
    }

    const systemPrompt = `You are the ZawMarketing Institutional Presentation Engine.
Your task is to generate a comprehensive, highly professional, brand-aligned Real Estate Investment Presentation Deck.

CRITICAL RULES:
1. Return ONLY valid structured JSON adhering strictly to the provided JSON Schema.
2. DO NOT return React code, JSX, HTML, CSS, JavaScript, or markdown code fences outside JSON.
3. Quantifiable Financial Claims: Use ONLY the provided numbers from the campaign source data and strategy. DO NOT invent or fabricate numbers.
4. If a factKey is applicable (e.g. purchase_price, renovation_estimate, arv, gross_spread, in_place_cap_rate, stabilized_cap_rate_on_purchase), attach it so the client truth engine can resolve it dynamically.
5. Create a coherent 8-14 slide investment story covering: Cover, Executive Summary, Property Specifications, Investment Thesis, Financial Snapshot, Execution Timeline, Market Context, Marketing Strategy, Creative Showcase, Video Concept, Risk Disclosures, and Next Steps.
6. Provide concise, professional, actionable speakerNotes on every slide.`;

    const userPrompt = `Generate a complete investment presentation deck for this campaign:
${JSON.stringify({ campaign: body.campaign, brandKit: body.brandKit }, null, 2)}`;

    const { data: presentation, latencyMs, estimatedTokens } = await generateGeminiJson<Record<string, unknown>>({
      modelId,
      systemPrompt,
      userPrompt,
      responseSchema: presentationResponseJsonSchema,
      thinkingLevel: body.thinkingLevel,
    });

    const responsePayload = {
      presentation,
      metadata: {
        requestedModel: modelId,
        actualModel: modelId,
        fallbackOccurred: false,
        latencyMs,
        estimatedTokens,
        timestamp: new Date().toISOString(),
      },
    };

    await finishGeneration({
      claimId: claim.claimId,
      responsePayload,
      success: true,
      latencyMs,
    });

    return jsonResponse(responsePayload);
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error);
    }
    if (error instanceof ProviderError) {
      return errorResponse(providerAppError(error));
    }
    console.error('Unhandled presentation generation error:', error);
    return errorResponse(new AppError('internal_error', 500, 'An unexpected server error occurred during presentation generation.'));
  }
});
