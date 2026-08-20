// Supabase Edge Function: generate-image
// Description: Server-side visual concept image generation supporting BFL, NVIDIA, Gemini, and OpenAI

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

    // 1. Verify User Authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      brief, 
      provider = 'bfl', 
      model = 'flux-2-pro',
      organizationId, 
      campaignId 
    } = await req.json();

    let imageUrl = '';
    let estimatedCost = 0.0;
    let providerRequestId = '';

    // 2. Black Forest Labs (FLUX.2)
    if (provider === 'bfl') {
      const bflKey = Deno.env.get('BFL_API_KEY');
      if (!bflKey) {
        return new Response(
          JSON.stringify({ error: 'BFL_API_KEY is not configured on server' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const endpoint = model === 'flux-2-max' ? 'flux-pro-1.1' : 'flux-pro-1.1';
      const submitRes = await fetch(`https://api.bfl.ml/v1/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-key': bflKey,
        },
        body: JSON.stringify({
          prompt: brief.subject,
          width: brief.aspectRatio === '16:9' ? 1344 : brief.aspectRatio === '9:16' ? 768 : 1024,
          height: brief.aspectRatio === '16:9' ? 768 : brief.aspectRatio === '9:16' ? 1344 : 1024,
          prompt_upsampling: true,
          safety_tolerance: 2,
        }),
      });

      if (!submitRes.ok) {
        const errText = await submitRes.text();
        throw new Error(`BFL API error: ${errText}`);
      }

      const submitData = await submitRes.json();
      providerRequestId = submitData.id;

      // Poll for completion (up to 20s)
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const pollRes = await fetch(`https://api.bfl.ml/v1/get_result?id=${providerRequestId}`, {
          headers: { 'x-key': bflKey },
        });
        if (!pollRes.ok) continue;
        const pollData = await pollRes.json();
        if (pollData.status === 'Ready' && pollData.result?.sample) {
          imageUrl = pollData.result.sample;
          break;
        }
      }

      estimatedCost = model === 'flux-2-max' ? 0.08 : 0.05;
    }

    // 3. NVIDIA NIM
    else if (provider === 'nvidia') {
      const nvidiaKey = Deno.env.get('NVIDIA_API_KEY');
      if (!nvidiaKey) {
        return new Response(
          JSON.stringify({ error: 'NVIDIA_API_KEY is not configured on server' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const res = await fetch('https://integrate.api.nvidia.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${nvidiaKey}`,
        },
        body: JSON.stringify({
          model: model || 'stabilityai/sdxl-turbo',
          prompt: `High-end architectural photography: ${brief.subject}`,
          cfg_scale: 7,
          samples: 1,
          steps: 4,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`NVIDIA API error: ${errText}`);
      }

      const data = await res.json();
      imageUrl = data?.data?.[0]?.url || (data?.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : '');
      estimatedCost = 0.0;
    }

    if (!imageUrl) {
      throw new Error('Image generation completed without returning an image URL.');
    }

    // Audit log
    await supabaseClient.from('ai_generation_logs').insert({
      organization_id: organizationId || null,
      user_id: user.id,
      campaign_id: campaignId || null,
      operation_type: 'generate-image',
      provider,
      model,
      status: 'success',
      latency_ms: Date.now() - startTime,
    });

    return new Response(
      JSON.stringify({
        url: imageUrl,
        provider,
        model,
        estimatedCostUsd: estimatedCost,
        providerRequestId,
        isAiIllustrative: true,
        isConceptual: true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
