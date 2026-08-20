// Authenticated backend status. This endpoint never calls an AI provider and
// never returns a credential or raw secret.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { AppError } from '../_shared/errors.ts';
import { assertOrganizationAccess, authenticate } from '../_shared/auth.ts';
import { handleOptions, ensurePost, errorResponse, jsonResponse } from '../_shared/http.ts';
import { parseBody, healthRequestSchema } from '../_shared/validation.ts';
import { BFL_IMAGE_MODELS, GEMINI_TEXT_MODELS, NVIDIA_IMAGE_MODELS } from '../_shared/providers.ts';

const configured = (name: string): boolean => Boolean(Deno.env.get(name));
const configuredPricing = (name: string): boolean => {
  const value = Number(Deno.env.get(name));
  return Number.isFinite(value) && value >= 0;
};

serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  try {
    ensurePost(req);
    const ctx = await authenticate(req);
    const body = await parseBody(req, healthRequestSchema);
    let paidGenerationEnabled = false;
    if (body.organizationId) {
      await assertOrganizationAccess(ctx, body.organizationId);
      const { data: settings, error } = await ctx.admin
        .from('ai_provider_settings')
        .select('paid_generation_enabled')
        .eq('organization_id', body.organizationId)
        .maybeSingle();
      if (error) throw new AppError('server_control_unavailable', 503, 'Backend status is temporarily unavailable.');
      paidGenerationEnabled = settings?.paid_generation_enabled === true;
    }
    return jsonResponse(req, {
      ok: true,
      status: 'healthy',
      providers: {
        text: { provider: 'gemini', configured: configured('GEMINI_API_KEY'), models: GEMINI_TEXT_MODELS },
        images: {
          bfl: { configured: configured('BFL_API_KEY') && configuredPricing('BFL_ESTIMATED_COST_USD'), models: BFL_IMAGE_MODELS },
          nvidia: { configured: configured('NVIDIA_API_KEY') && configuredPricing('NVIDIA_ESTIMATED_COST_USD'), models: NVIDIA_IMAGE_MODELS },
          gemini: { configured: false, models: [] },
          openai: { configured: false, models: [] },
        },
      },
      paidGenerationEnabled,
    });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(req, error);
    return errorResponse(req, new AppError('internal_error', 500, 'Backend status is temporarily unavailable.'));
  }
});
