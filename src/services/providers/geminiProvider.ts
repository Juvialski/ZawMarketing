import { GoogleGenAI } from '@google/genai';
import { IAIProvider, GenerationProgressCallback } from '../../types/providers';
import { CampaignSourceData, CampaignStrategy, CampaignCopy, CopyQualityReport } from '../../types/campaign';
import { BrandKit } from '../../types/brandKit';
import { MockAIProvider } from './mockProvider';
import { AntiSlopCritic } from '../marketing/antiSlopCritic';

export class GeminiProvider implements IAIProvider {
  public id = 'gemini-provider';
  public name = 'Google Gemini (Interactions & Structured GenAI)';
  private apiKey: string;
  private modelName: string;
  private mockFallback: MockAIProvider;

  constructor(apiKey: string, modelName = 'gemini-3.7-flash') {
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.mockFallback = new MockAIProvider();
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async generateStrategy(
    sourceData: CampaignSourceData,
    brandKit: BrandKit,
    onProgress?: GenerationProgressCallback
  ): Promise<CampaignStrategy> {
    if (!this.isConfigured()) {
      console.info('Gemini API key not configured, using high-fidelity mock strategy generator.');
      return this.mockFallback.generateStrategy(sourceData, brandKit, onProgress);
    }

    try {
      onProgress?.('Connecting to Gemini AI', 20, `Initializing ${this.modelName}...`);
      const ai = new GoogleGenAI({ apiKey: this.apiKey });

      const prompt = `You are a senior real estate marketing strategist and institutional acquisitions analyst.
Analyze the following real estate source information and generate a high-impact, professional campaign strategy.
CRITICAL RULE: Never use generic AI slop (e.g. "unlock the potential", "game-changing", "nestled in the heart"). Be quantitative, concrete, and credible.

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

Return a structured JSON object with the following fields:
- targetAudience: { name: string, description: string, painPoints: string[], motivations: string[] }
- primaryObjective: string
- coreAngle: string
- keyHooks: string[] (3 quantitative hooks)
- valueProposition: string
- supportingEvidence: string[] (3 supporting facts/comps)
- ctaStrategy: string
- suggestedPlatforms: string[] (['facebook', 'instagram', 'linkedin', 'email', 'video_reels'])`;

      onProgress?.('Synthesizing Strategy via Gemini', 60, 'Generating structured audience & hook strategy...');
      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      onProgress?.('Validating Strategy Schema', 90, 'Parsing structured response...');
      const text = response.text || '';
      const parsed = JSON.parse(text) as CampaignStrategy;
      onProgress?.('Strategy Ready', 100, 'Completed successfully');
      return parsed;
    } catch (err) {
      console.warn('Gemini generateStrategy failed, falling back to mock provider:', err);
      return this.mockFallback.generateStrategy(sourceData, brandKit, onProgress);
    }
  }

  public async generateCopy(
    sourceData: CampaignSourceData,
    strategy: CampaignStrategy,
    brandKit: BrandKit,
    onProgress?: GenerationProgressCallback
  ): Promise<CampaignCopy> {
    if (!this.isConfigured()) {
      return this.mockFallback.generateCopy(sourceData, strategy, brandKit, onProgress);
    }

    try {
      onProgress?.('Connecting to Gemini AI', 15, `Initializing ${this.modelName}...`);
      const ai = new GoogleGenAI({ apiKey: this.apiKey });

      const prompt = `You are an elite real estate copywriter. Write a full multi-platform marketing copy package based on the approved campaign strategy.

RULES FOR ANTI-SLOP REAL ESTATE COPYWRITING:
1. NEVER use clichés: "unlock potential", "game changer", "nestled in", "whether you're an investor", "boasts", "rare opportunity".
2. Never invent fake ROI or financial returns not provided in the source data.
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

      onProgress?.('Generating Platform Copy', 65, 'Writing platform-specific copy and video script...');
      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      onProgress?.('Reviewing Quality', 85, 'Executing anti-slop review layer...');
      const text = response.text || '';
      const parsed = JSON.parse(text) as CampaignCopy;

      const qualityReport = AntiSlopCritic.reviewCampaignCopy(parsed, sourceData, brandKit);
      parsed.qualityReport = qualityReport;

      onProgress?.('Copy Generation Complete', 100, 'All platforms generated & verified');
      return parsed;
    } catch (err) {
      console.warn('Gemini generateCopy failed, falling back to mock provider:', err);
      return this.mockFallback.generateCopy(sourceData, strategy, brandKit, onProgress);
    }
  }

  public async reviewCopyQuality(
    copy: CampaignCopy,
    sourceData: CampaignSourceData,
    brandKit: BrandKit
  ): Promise<CopyQualityReport> {
    return AntiSlopCritic.reviewCampaignCopy(copy, sourceData, brandKit);
  }
}
