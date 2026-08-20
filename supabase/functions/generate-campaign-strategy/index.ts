// Supabase Edge Function: generate-campaign-strategy
// Description: Server-side Gemini strategy generation with API key protection and auth verification

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

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { sourceData, brandKit, organizationId, campaignId } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY is not configured on server' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prop = sourceData.property;
    const prompt = `You are an elite institutional real estate acquisitions strategist.
Analyze this property and brand to build a quantitative marketing strategy.
Property: ${prop?.address || sourceData.targetMarket}
Type: ${sourceData.campaignType}
Purchase Basis: $${prop?.financials?.purchasePrice || 'N/A'}
Renovation Scope: $${prop?.financials?.renovationEstimate || 'N/A'}
ARV: $${prop?.financials?.arv || 'N/A'}
Thesis: ${prop?.investmentThesis || 'Value-add investment'}
Brand: ${brandKit?.companyName || 'Apex Capital'}

Generate a structured JSON response matching this schema:
{
  "targetAudience": {
    "name": "string",
    "painPoints": ["string", "string", "string"],
    "motivations": ["string", "string", "string"]
  },
  "coreAngle": "string",
  "valueProposition": "string",
  "keyHooks": ["string", "string", "string"],
  "supportingEvidence": ["string", "string", "string"],
  "suggestedPlatforms": ["linkedin", "instagram", "facebook", "email", "video"]
}
Avoid all AI cliches like "unlock the potential", "game-changer", or "nestled". Focus on hard numbers, margin spreads, and comps.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    const strategy = JSON.parse(rawText);

    // Audit log
    await supabaseClient.from('ai_generation_logs').insert({
      organization_id: organizationId || null,
      user_id: user.id,
      campaign_id: campaignId || null,
      operation_type: 'generate-strategy',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      status: 'success',
      latency_ms: Date.now() - startTime,
    });

    return new Response(JSON.stringify({ strategy }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
