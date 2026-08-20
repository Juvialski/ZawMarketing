/**
 * OpenAI Image Provider Adapter (Future GPT Image / DALL-E 3)
 * Designed for future enterprise OpenAI connection without modifying campaign logic.
 */

import { 
  IImageProvider, 
  GeneratedImageResult, 
  ImageCreativeBrief 
} from '../../types/providers';
import { CreativeBriefComposer } from './creativeBriefComposer';
import { ImageSpendingTracker } from './imageSpendingTracker';
import { UploadOnlyProvider } from './imageProvider';

export class OpenAiImageProvider implements IImageProvider {
  public id = 'openai-image-provider';
  public name = 'OpenAI Image Engine (GPT Image 2 / DALL-E 3)';
  private apiKey?: string;
  private baseUrl: string;
  private defaultModelId: string;
  private uploadFallback: UploadOnlyProvider;

  constructor(
    apiKey?: string,
    defaultModelId = 'gpt-image-2',
    baseUrl = 'https://api.openai.com/v1'
  ) {
    this.apiKey = apiKey;
    this.defaultModelId = defaultModelId;
    this.baseUrl = baseUrl;
    this.uploadFallback = new UploadOnlyProvider();
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async generateConceptImage(
    prompt: string,
    aspectRatio: '1:1' | '4:5' | '16:9' | '9:16' = '1:1',
    contextNotes?: string
  ): Promise<GeneratedImageResult> {
    const brief: ImageCreativeBrief = {
      purpose: 'hero',
      subject: prompt,
      aspectRatio,
      constraints: contextNotes,
      qualityTier: 'paid_standard',
    };
    return this.generateFromBrief(brief);
  }

  public async generateFromBrief(
    brief: ImageCreativeBrief,
    onProgress?: (step: string, percent: number) => void
  ): Promise<GeneratedImageResult> {
    const startTime = Date.now();
    const modelId = this.defaultModelId || 'gpt-image-2';
    const estimatedCost = 0.06;

    if (!this.isConfigured()) {
      console.info(`OpenAI Image API Key not configured. Using authentic curated architectural photography fixture.`);
      const fallback = await this.uploadFallback.generateConceptImage(brief.subject, brief.aspectRatio);
      return {
        ...fallback,
        metadata: {
          modelId: `${modelId}-simulated-fixture`,
          prompt: brief.subject,
          latencyMs: Date.now() - startTime,
          estimatedCostUsd: 0.0,
        },
      };
    }

    onProgress?.(`Composing prompt for OpenAI ${modelId}...`, 20);
    const fullPrompt = CreativeBriefComposer.briefToPrompt(brief);

    try {
      onProgress?.(`Dispatching to OpenAI image endpoint...`, 50);

      const size = brief.aspectRatio === '16:9' ? '1792x1024' : brief.aspectRatio === '9:16' ? '1024x1792' : '1024x1024';

      const res = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey!}`,
        },
        body: JSON.stringify({
          model: modelId === 'gpt-image-2' ? 'dall-e-3' : modelId,
          prompt: fullPrompt,
          n: 1,
          size,
          quality: 'standard',
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI API error (HTTP ${res.status}): ${errText}`);
      }

      const data = await res.json();
      const imageUrl = data.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error('No image URL returned by OpenAI.');
      }

      const costMeta = ImageSpendingTracker.recordGeneration({
        provider: 'openai_image',
        model: modelId,
        costUsd: estimatedCost,
        purpose: brief.purpose,
        success: true,
      });

      return {
        id: `openai-${Date.now()}`,
        url: imageUrl,
        altText: `${brief.purpose.toUpperCase()} — ${brief.subject}`,
        isAiIllustrative: true,
        provider: 'openai_image',
        costMetadata: costMeta,
        metadata: {
          modelId,
          prompt: fullPrompt,
          latencyMs: Date.now() - startTime,
          estimatedCostUsd: estimatedCost,
        },
      };
    } catch (err: any) {
      console.warn(`OpenAI image generation failed:`, err);
      const fallback = await this.uploadFallback.generateConceptImage(brief.subject, brief.aspectRatio);
      return {
        ...fallback,
        metadata: {
          modelId: `${modelId}-failed-fallback`,
          prompt: brief.subject,
          latencyMs: Date.now() - startTime,
          estimatedCostUsd: 0.0,
        },
      };
    }
  }
}
