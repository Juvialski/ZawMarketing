// Supabase Edge Function: generate-copy
// Description: Multi-platform real estate copy & full kit generation with anti-slop review and model routing

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { sourceData, strategy, brandKit, organizationId, campaignId, isFullKit, modelId } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY is not configured on server' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetModel = modelId || 'gemini-3.5-flash-lite';
    const prop = sourceData.property;

    let prompt = '';
    if (isFullKit) {
      prompt = `You are a premier real estate marketing strategist, underwriter, and anti-slop copywriter.
Analyze the following source data and generate a complete marketing kit in a single structured JSON response.

Property: ${prop?.address || sourceData.targetMarket}
Financials: Purchase $${prop?.financials?.purchasePrice || 'N/A'} | Reno $${prop?.financials?.renovationEstimate || 'N/A'} | ARV $${prop?.financials?.arv || 'N/A'} | Spread $${prop?.financials?.equitySpread || 'N/A'}
Brand: ${brandKit?.companyName || 'Apex Capital'} | Tone: ${brandKit?.toneOfVoice || 'Institutional'}

Return JSON matching:
{
  "strategy": {
    "targetAudience": { "name": "string", "description": "string", "painPoints": ["string"], "motivations": ["string"] },
    "primaryObjective": "string",
    "coreAngle": "string",
    "keyHooks": ["string", "string", "string"],
    "valueProposition": "string",
    "supportingEvidence": ["string", "string", "string"],
    "ctaStrategy": "string",
    "suggestedPlatforms": ["facebook", "instagram", "linkedin", "email", "video_reels"]
  },
  "copy": {
    "headlines": ["string", "string", "string"],
    "ctas": ["string", "string", "string"],
    "facebook": { "headline": "string", "body": "string", "cta": "string", "characterCount": 500 },
    "instagram": { "headline": "string", "body": "string", "cta": "string", "hashtags": ["string"], "characterCount": 450 },
    "linkedin": { "headline": "string", "body": "string", "cta": "string", "characterCount": 750 },
    "emailNewsletter": { "subjectLines": ["string", "string", "string"], "previewText": "string", "bodyMarkdown": "string", "ctaButtonText": "string" },
    "videoScript": {
      "title": "string", "durationSeconds": 60, "targetFormat": "9:16 vertical reel", "hook": "string", "callToAction": "string",
      "scenes": [
        { "timeframe": "0:00 - 0:05", "visualDirection": "string", "spokenAudio": "string", "onScreenText": "string" },
        { "timeframe": "0:05 - 0:25", "visualDirection": "string", "spokenAudio": "string", "onScreenText": "string" },
        { "timeframe": "0:25 - 0:42", "visualDirection": "string", "spokenAudio": "string", "onScreenText": "string" },
        { "timeframe": "0:42 - 0:60", "visualDirection": "string", "spokenAudio": "string", "onScreenText": "string" }
      ]
    }
  }
}
ANTI-SLOP RULES: Never use "unlock the potential", "nestled", "game-changer", "rare opportunity", or fake urgency.`;
    } else {
      prompt = `You are a premier real estate marketing copywriter and underwriting analyst.
Generate a complete multi-platform copywriting package for this property based on the strategic angle.

Property: ${prop?.address || sourceData.targetMarket}
Financials: Purchase $${prop?.financials?.purchasePrice || 'N/A'} | Reno $${prop?.financials?.renovationEstimate || 'N/A'} | ARV $${prop?.financials?.arv || 'N/A'} | Spread $${prop?.financials?.equitySpread || 'N/A'}
Core Angle: ${strategy?.coreAngle || 'Value-add investment opportunity'}
Brand: ${brandKit?.companyName || 'Apex Capital'} | Tone: ${brandKit?.toneOfVoice || 'Institutional'} | CTA: ${brandKit?.preferredCta}

Generate a structured JSON matching:
{
  "headlines": ["string", "string", "string"],
  "ctas": ["string", "string", "string"],
  "facebook": { "headline": "string", "body": "string", "cta": "string", "characterCount": 500 },
  "instagram": { "headline": "string", "body": "string", "cta": "string", "hashtags": ["string"], "characterCount": 450 },
  "linkedin": { "headline": "string", "body": "string", "cta": "string", "characterCount": 750 },
  "emailNewsletter": { "subjectLines": ["string", "string", "string"], "previewText": "string", "bodyMarkdown": "string", "ctaButtonText": "string" },
  "videoScript": {
    "title": "string", "durationSeconds": 60, "targetFormat": "9:16 vertical reel", "hook": "string", "callToAction": "string",
    "scenes": [
      { "timeframe": "0:00 - 0:05", "visualDirection": "string", "spokenAudio": "string", "onScreenText": "string" },
      { "timeframe": "0:05 - 0:25", "visualDirection": "string", "spokenAudio": "string", "onScreenText": "string" },
      { "timeframe": "0:25 - 0:45", "visualDirection": "string", "spokenAudio": "string", "onScreenText": "string" },
      { "timeframe": "0:45 - 1:00", "visualDirection": "string", "spokenAudio": "string", "onScreenText": "string" }
    ]
  }
}
ANTI-SLOP RULES: Never use generic buzzwords or unverified ROI claims.`;
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.25,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      throw new Error(`Gemini API error (HTTP ${geminiRes.status}): ${errBody}`);
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawText);

    // Audit log
    await supabaseClient.from('ai_generation_logs').insert({
      organization_id: organizationId || null,
      user_id: user.id,
      campaign_id: campaignId || null,
      operation_type: isFullKit ? 'generate-full-kit' : 'generate-copy',
      provider: 'gemini',
      model: targetModel,
      status: 'success',
      latency_ms: Date.now() - startTime,
    });

    if (isFullKit) {
      return new Response(JSON.stringify({ strategy: parsed.strategy, copy: parsed.copy, model: targetModel }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ copy: parsed, model: targetModel }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
