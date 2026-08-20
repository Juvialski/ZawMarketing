import { GoogleGenAI } from '@google/genai';
import { 
  IAIProvider, 
  GenerationProgressCallback, 
  GenerationOptions, 
  FullKitGenerationResult 
} from '../../types/providers';
import { CampaignSourceData, CampaignStrategy, CampaignCopy, CopyQualityReport } from '../../types/campaign';
import { BrandKit } from '../../types/brandKit';
import { MockAIProvider } from './mockProvider';
import { AntiSlopCritic } from '../marketing/antiSlopCritic';
import { QuotaManager } from './quotaManager';

export class GeminiProvider implements IAIProvider {
  public id = 'gemini-provider';
  public name = 'Google Gemini (Interactions & Structured GenAI)';
  private apiKey: string;
  private defaultModelName: string;
  private mockFallback: MockAIProvider;

  constructor(apiKey: string, defaultModelName = 'gemini-3.5-flash-lite') {
    this.apiKey = apiKey;
    this.defaultModelName = defaultModelName;
    this.mockFallback = new MockAIProvider();
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Helper to build Google GenAI client instance.
   */
  private getAIClient(): GoogleGenAI {
    return new GoogleGenAI({ apiKey: this.apiKey });
  }

  /**
   * 1. Single-Turn Full Marketing Kit Generation (Quota Conservation Engine)
   * Consolidates strategy + headlines + platform copy + email + video script into 1 single call.
   */
  public async generateFullMarketingKit(
    sourceData: CampaignSourceData,
    brandKit: BrandKit,
    onProgress?: GenerationProgressCallback,
    options?: GenerationOptions
  ): Promise<FullKitGenerationResult> {
    if (!this.isConfigured()) {
      return this.mockFallback.generateFullMarketingKit(sourceData, brandKit, onProgress, options);
    }

    const requestedModel = options?.modelId || this.defaultModelName;

    onProgress?.('Initializing Quota-Aware Campaign Pipeline...', 10, `Target Model: ${requestedModel}`);

    const prompt = `You are a premier real estate acquisitions strategist, quantitative underwriter, and anti-slop copywriter.
Analyze the following real estate source data and brand context, then generate a COMPLETE structured marketing kit.

CRITICAL ANTI-SLOP REAL ESTATE RULES:
1. NEVER use generic AI cliches: "unlock the potential", "game-changer", "nestled in the heart of", "whether you're an investor", "boasts", "rare opportunity", "hurry before it's gone".
2. Never invent fake ROI or financial returns not provided in source data. Use conservative spread calculations.
3. Keep sentences crisp, professional, and data-driven.
4. Adapt structure strictly for each platform:
   - Facebook: Narrative + bullet points + clear comment/message CTA
   - Instagram: Clean visual breakdown with emojis used sparingly as bullet points + hashtags
   - LinkedIn: Institutional underwriting memo tone + executive summary + clear professional CTA
   - Email: 3 compelling subject lines + preview text + markdown body + CTA button
   - Video Reel Script: High retention 60-second vertical reel script (hook 0-5s, problem/scope 5-25s, numbers/ARV 25-45s, CTA 45-60s) with visual directions and on-screen text.
5. Provide 3 high-impact headline options and 3 CTA options.

BRAND CONTEXT:
- Company Name: ${brandKit.companyName}
- Target Audience: ${brandKit.targetAudienceDefault}
- Tone of Voice: ${brandKit.toneOfVoice}
- Required Disclaimer: ${brandKit.requiredDisclaimer}
- Forbidden Words: ${JSON.stringify(brandKit.forbiddenWords || [])}

CAMPAIGN DATA:
- Campaign Type: ${sourceData.campaignType}
- Target Market: ${sourceData.targetMarket}
- Title: ${sourceData.title}
- Property Details: ${JSON.stringify(sourceData.property || {})}
- Topic Summary: ${sourceData.topicSummary || 'N/A'}
- Custom Notes: ${sourceData.customNotes || 'N/A'}

Return a structured JSON object with EXACTLY this shape:
{
  "strategy": {
    "targetAudience": {
      "name": "string",
      "description": "string",
      "painPoints": ["string", "string", "string"],
      "motivations": ["string", "string", "string"]
    },
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
    "facebook": {
      "headline": "string",
      "body": "string",
      "cta": "string",
      "characterCount": 500
    },
    "instagram": {
      "headline": "string",
      "body": "string",
      "cta": "string",
      "hashtags": ["string"],
      "characterCount": 450
    },
    "linkedin": {
      "headline": "string",
      "body": "string",
      "cta": "string",
      "characterCount": 750
    },
    "emailNewsletter": {
      "subjectLines": ["string", "string", "string"],
      "previewText": "string",
      "bodyMarkdown": "string",
      "ctaButtonText": "string"
    },
    "videoScript": {
      "title": "string",
      "durationSeconds": 60,
      "targetFormat": "9:16 vertical reel",
      "hook": "string",
      "callToAction": "string",
      "scenes": [
        { "timeframe": "0:00 - 0:05", "visualDirection": "string", "spokenAudio": "string", "onScreenText": "string" },
        { "timeframe": "0:05 - 0:25", "visualDirection": "string", "spokenAudio": "string", "onScreenText": "string" },
        { "timeframe": "0:25 - 0:42", "visualDirection": "string", "spokenAudio": "string", "onScreenText": "string" },
        { "timeframe": "0:42 - 0:60", "visualDirection": "string", "spokenAudio": "string", "onScreenText": "string" }
      ]
    }
  }
}`;

    const { result, metadata } = await QuotaManager.executeWithFallback({
      requestedModelId: requestedModel,
      operation: 'campaign_kit',
      execute: async (activeModelId) => {
        onProgress?.('Generating Structured Campaign Kit...', 50, `Executing via ${activeModelId}...`);
        const ai = this.getAIClient();

        const config: any = {
          responseMimeType: 'application/json',
        };

        const response = await ai.models.generateContent({
          model: activeModelId,
          contents: prompt,
          config,
        });

        const text = response.text || '';
        const parsed = JSON.parse(text) as { strategy: CampaignStrategy; copy: CampaignCopy };

        if (!parsed.strategy || !parsed.copy) {
          throw new Error('Malformed structured response: missing strategy or copy root fields.');
        }

        // Run anti-slop review layer
        const qualityReport = AntiSlopCritic.reviewCampaignCopy(parsed.copy, sourceData, brandKit);
        parsed.copy.qualityReport = qualityReport;

        return parsed;
      },
      fallbackToMock: async () => {
        const mockRes = await this.mockFallback.generateFullMarketingKit(sourceData, brandKit, onProgress);
        return { strategy: mockRes.strategy, copy: mockRes.copy };
      },
      skipFallback: options?.skipFallback,
    });

    result.strategy.generationMetadata = metadata;
    result.copy.generationMetadata = metadata;

    onProgress?.('Marketing Kit Ready', 100, `Completed with ${metadata.actualModel}`);

    return {
      strategy: result.strategy,
      copy: result.copy,
      metadata,
    };
  }

  /**
   * 2. Generate Campaign Strategy
   */
  public async generateStrategy(
    sourceData: CampaignSourceData,
    brandKit: BrandKit,
    onProgress?: GenerationProgressCallback,
    options?: GenerationOptions
  ): Promise<CampaignStrategy> {
    if (!this.isConfigured()) {
      return this.mockFallback.generateStrategy(sourceData, brandKit, onProgress, options);
    }

    const requestedModel = options?.modelId || this.defaultModelName;

    const prompt = `You are a senior real estate acquisitions strategist.
Analyze the following source data and generate a high-impact, professional campaign strategy.
CRITICAL RULE: Never use generic AI slop. Be quantitative, concrete, and credible.

COMPANY / BRAND CONTEXT:
- Company Name: ${brandKit.companyName}
- Target Audience: ${brandKit.targetAudienceDefault}
- Tone of Voice: ${brandKit.toneOfVoice}
- Required Disclaimer: ${brandKit.requiredDisclaimer}

CAMPAIGN DATA:
- Campaign Type: ${sourceData.campaignType}
- Target Market: ${sourceData.targetMarket}
- Title: ${sourceData.title}
- Property Details: ${JSON.stringify(sourceData.property || {})}
- Topic Summary: ${sourceData.topicSummary || 'N/A'}
- Custom Notes: ${sourceData.customNotes || 'N/A'}

Return a structured JSON object:
{
  "targetAudience": { "name": "string", "description": "string", "painPoints": ["string"], "motivations": ["string"] },
  "primaryObjective": "string",
  "coreAngle": "string",
  "keyHooks": ["string", "string", "string"],
  "valueProposition": "string",
  "supportingEvidence": ["string", "string", "string"],
  "ctaStrategy": "string",
  "suggestedPlatforms": ["facebook", "instagram", "linkedin", "email", "video_reels"]
}`;

    const { result, metadata } = await QuotaManager.executeWithFallback({
      requestedModelId: requestedModel,
      operation: 'campaign_strategy',
      execute: async (activeModelId) => {
        onProgress?.('Synthesizing Strategy via Gemini', 60, `Using ${activeModelId}...`);
        const ai = this.getAIClient();

        const response = await ai.models.generateContent({
          model: activeModelId,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text || '';
        return JSON.parse(text) as CampaignStrategy;
      },
      fallbackToMock: () => this.mockFallback.generateStrategy(sourceData, brandKit, onProgress, options),
      skipFallback: options?.skipFallback,
    });

    result.generationMetadata = metadata;
    onProgress?.('Strategy Ready', 100, `Completed via ${metadata.actualModel}`);
    return result;
  }

  /**
   * 3. Generate Multi-Platform Copy
   */
  public async generateCopy(
    sourceData: CampaignSourceData,
    strategy: CampaignStrategy,
    brandKit: BrandKit,
    onProgress?: GenerationProgressCallback,
    options?: GenerationOptions
  ): Promise<CampaignCopy> {
    if (!this.isConfigured()) {
      return this.mockFallback.generateCopy(sourceData, strategy, brandKit, onProgress, options);
    }

    const requestedModel = options?.modelId || this.defaultModelName;

    const prompt = `You are an elite real estate copywriter. Write a full multi-platform marketing copy package based on the approved campaign strategy.

RULES FOR ANTI-SLOP REAL ESTATE COPYWRITING:
1. NEVER use clichés: "unlock potential", "game changer", "nestled in", "whether you're an investor", "boasts", "rare opportunity".
2. Never invent fake ROI or financial returns.
3. Keep sentences crisp, professional, and data-driven.
4. Adapt structure strictly for each platform:
   - Facebook: Narrative + bullet points + clear comment/message CTA
   - Instagram: Clean visual breakdown with emojis used sparingly as bullet points + hashtags
   - LinkedIn: Institutional underwriting memo tone + executive summary + clear professional CTA
   - Email: 3 compelling subject lines + preview text + markdown body + CTA button
   - Video Reel Script: High retention 60-second vertical reel script (hook 0-5s, problem/scope 5-25s, numbers/ARV 25-45s, CTA 45-60s) with visual directions and on-screen text.
5. Provide 3 high-impact headline options and 3 CTA options.

BRAND KIT:
- Company: ${brandKit.companyName}
- Phone: ${brandKit.phone}
- Email: ${brandKit.email}
- Website: ${brandKit.website}
- Tone: ${brandKit.toneOfVoice}
- Required Disclaimer: ${brandKit.requiredDisclaimer}
- Forbidden Words: ${JSON.stringify(brandKit.forbiddenWords || [])}

STRATEGY:
${JSON.stringify(strategy)}

SOURCE DATA:
${JSON.stringify(sourceData)}`;

    const { result, metadata } = await QuotaManager.executeWithFallback({
      requestedModelId: requestedModel,
      operation: 'platform_variants',
      execute: async (activeModelId) => {
        onProgress?.('Generating Platform Copy', 65, `Writing via ${activeModelId}...`);
        const ai = this.getAIClient();

        const response = await ai.models.generateContent({
          model: activeModelId,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text || '';
        const parsed = JSON.parse(text) as CampaignCopy;
        const qualityReport = AntiSlopCritic.reviewCampaignCopy(parsed, sourceData, brandKit);
        parsed.qualityReport = qualityReport;
        return parsed;
      },
      fallbackToMock: () => this.mockFallback.generateCopy(sourceData, strategy, brandKit, onProgress, options),
      skipFallback: options?.skipFallback,
    });

    result.generationMetadata = metadata;
    onProgress?.('Copy Ready', 100, `Completed via ${metadata.actualModel}`);
    return result;
  }

  /**
   * 4. Review Copy Quality with Optional Premium Model
   */
  public async reviewCopyQuality(
    copy: CampaignCopy,
    sourceData: CampaignSourceData,
    brandKit: BrandKit,
    options?: GenerationOptions
  ): Promise<CopyQualityReport> {
    // Run instant rule-based anti-slop audit
    const localReport = AntiSlopCritic.reviewCampaignCopy(copy, sourceData, brandKit);

    // If premium model is requested for deep reasoning QA pass
    if (options?.modelId && this.isConfigured()) {
      try {
        const { result } = await QuotaManager.executeWithFallback({
          requestedModelId: options.modelId,
          operation: 'final_review',
          execute: async (activeModelId) => {
            const ai = this.getAIClient();
            const reviewPrompt = `You are a senior real estate legal compliance and quality QA director.
Audit the following real estate marketing copy package against regulatory compliance, anti-slop standards, and financial consistency.

Source Data: ${JSON.stringify(sourceData)}
Brand Kit: ${JSON.stringify(brandKit)}
Copy: ${JSON.stringify(copy)}

Return JSON:
{
  "overallScore": number (0-100),
  "slopIndex": "clean" | "mild_cliches" | "heavy_slop",
  "issues": [
    { "id": "string", "severity": "warning" | "error" | "suggestion", "rule": "string", "matchedText": "string", "explanation": "string", "platform": "string" }
  ],
  "factualIntegrityVerified": boolean,
  "unsupportedClaimsDetected": ["string"]
}`;

            const response = await ai.models.generateContent({
              model: activeModelId,
              contents: reviewPrompt,
              config: { responseMimeType: 'application/json' },
            });

            return JSON.parse(response.text || '{}') as CopyQualityReport;
          },
          fallbackToMock: async () => localReport,
          skipFallback: true,
        });

        return result;
      } catch (e) {
        console.warn('Premium review failed, using deterministic audit:', e);
      }
    }

    return localReport;
  }
}
