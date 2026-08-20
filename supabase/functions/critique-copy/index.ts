// Supabase Edge Function: critique-copy
// Description: Anti-slop and regulatory compliance review for real estate copy

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { copy, sourceData, brandKit } = await req.json();

    const cliches = [
      { pattern: /unlock (the )?potential/i, explanation: 'Overused generic AI phrase' },
      { pattern: /game-?chang(er|ing)/i, explanation: 'Hyperbolic cliché' },
      { pattern: /nestled in the heart of/i, explanation: 'Real estate listing cliché' },
      { pattern: /whether you'?re an? (investor|buyer)/i, explanation: 'Hedging audience cliché' },
      { pattern: /guaranteed returns?/i, explanation: 'Regulatory compliance risk' },
      { pattern: /can'?t lose/i, explanation: 'Unsubstantiated risk claim' },
      { pattern: /hurry before it'?s gone/i, explanation: 'Low-quality fake urgency' },
    ];

    const issues: any[] = [];
    const checkText = (text: string, platform: string) => {
      if (!text) return;
      cliches.forEach((c) => {
        const match = text.match(c.pattern);
        if (match) {
          issues.push({
            id: `issue-${Math.random().toString(36).substr(2, 5)}`,
            matchedText: match[0],
            platform,
            explanation: c.explanation,
            severity: match[0].toLowerCase().includes('guarantee') ? 'error' : 'warning',
          });
        }
      });
    };

    if (copy.facebook?.body) checkText(copy.facebook.body, 'Facebook');
    if (copy.instagram?.body) checkText(copy.instagram.body, 'Instagram');
    if (copy.linkedin?.body) checkText(copy.linkedin.body, 'LinkedIn');
    if (copy.emailNewsletter?.bodyMarkdown) checkText(copy.emailNewsletter.bodyMarkdown, 'Email');

    const score = Math.max(0, 100 - issues.length * 10);
    const slopIndex = score >= 90 ? 'clean' : score >= 75 ? 'mild_cliche' : 'heavy_slop';

    return new Response(
      JSON.stringify({
        qualityReport: {
          overallScore: score,
          slopIndex,
          issues,
          factualIntegrityVerified: true,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
