import { IImageProvider, GeneratedImageResult, ImageCreativeBrief } from '../../types/providers';
import { UploadOnlyProvider } from './imageProvider';
import { UsageTracker } from './usageTracker';
import { CreativeBriefComposer } from './creativeBriefComposer';

export class NvidiaImageProvider implements IImageProvider {
  public id = 'nvidia-image-provider';
  public name = 'NVIDIA NIM Visual Engine';
  private apiKey?: string;
  private modelName: string;
  private baseUrl: string;
  private uploadFallback: UploadOnlyProvider;

  constructor(
    apiKey?: string,
    modelName = 'stabilityai/sdxl-turbo',
    baseUrl = 'https://integrate.api.nvidia.com/v1'
  ) {
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.baseUrl = baseUrl;
    this.uploadFallback = new UploadOnlyProvider();
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async generateConceptImage(
    prompt: string,
    aspectRatio: '1:1' | '4:5' | '16:9' | '9:16',
    contextNotes?: string
  ): Promise<GeneratedImageResult> {
    const brief: ImageCreativeBrief = {
      purpose: 'hero',
      subject: prompt,
      aspectRatio,
      constraints: contextNotes,
      qualityTier: 'free_dev',
    };
    return this.generateFromBrief(brief);
  }

  public async generateFromBrief(
    brief: ImageCreativeBrief,
    onProgress?: (step: string, percent: number) => void
  ): Promise<GeneratedImageResult> {
    if (!this.isConfigured()) {
      console.info('NVIDIA API Key not configured. Using curated high-resolution photography fixture.');
      return this.uploadFallback.generateFromBrief(brief);
    }

    const startTime = Date.now();
    onProgress?.(`Composing prompt for NVIDIA NIM (${this.modelName})...`, 25);
    const cleanPrompt = CreativeBriefComposer.briefToPrompt(brief);

    try {
      onProgress?.(`Dispatching request to NVIDIA NIM...`, 50);

      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.modelName,
          prompt: cleanPrompt,
          cfg_scale: 7,
          samples: 1,
          steps: this.modelName.includes('turbo') ? 4 : 25,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`NVIDIA image API returned HTTP ${response.status}: ${errorText}`);
        return this.uploadFallback.generateFromBrief(brief);
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;

      const imageItem = data?.data?.[0] || data?.artifacts?.[0];
      const imageUrl = imageItem?.url || (imageItem?.base64 ? `data:image/png;base64,${imageItem.base64}` : null);

      if (!imageUrl) {
        console.warn('NVIDIA image API response did not contain image data. Falling back.');
        return this.uploadFallback.generateFromBrief(brief);
      }

      UsageTracker.recordUsage({
        provider: 'nvidia',
        model: this.modelName,
        operation: 'general_generation',
        success: true,
        latencyMs,
      });

      return {
        id: `nvidia-img-${Date.now()}`,
        url: imageUrl,
        altText: `NVIDIA AI Concept: ${brief.subject}`,
        isAiIllustrative: true,
        provider: 'nvidia_nim',
        metadata: {
          modelId: this.modelName,
          prompt: cleanPrompt,
          latencyMs,
          estimatedCostUsd: 0.0,
        },
      };
    } catch (err) {
      console.warn('NVIDIA image generation encountered network or processing error, falling back:', err);
      return this.uploadFallback.generateFromBrief(brief);
    }
  }
}
