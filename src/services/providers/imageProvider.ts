import { 
  IImageProvider, 
  GeneratedImageResult, 
  ImageCreativeBrief, 
  ProviderConfig 
} from '../../types/providers';
import { GoogleGenAI } from '@google/genai';
import { UsageTracker } from './usageTracker';
import { CreativeBriefComposer } from './creativeBriefComposer';
import { BflImageProvider } from './bflImageProvider';
import { GeminiPaidImageProvider } from './geminiImageProvider';
import { OpenAiImageProvider } from './openaiImageProvider';
import { NvidiaImageProvider } from './nvidiaImageProvider';

export const CURATED_STOCK_PHOTOS = [
  {
    id: 'stock-modern-exterior',
    name: 'Modern Single Family Exterior',
    url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1600&q=80',
    category: 'exterior',
  },
  {
    id: 'stock-luxury-villa',
    name: 'Contemporary Luxury Residence',
    url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80',
    category: 'exterior',
  },
  {
    id: 'stock-modern-kitchen',
    name: 'Renovated Open Concept Kitchen',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
    category: 'interior',
  },
  {
    id: 'stock-primary-suite',
    name: 'Spacious Primary Bedroom Suite',
    url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1600&q=80',
    category: 'interior',
  },
  {
    id: 'stock-multifamily',
    name: 'Boutique Apartment Community',
    url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80',
    category: 'commercial',
  },
  {
    id: 'stock-modern-living',
    name: 'Sunlit Hardwood Living Room',
    url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80',
    category: 'interior',
  },
  {
    id: 'stock-aerial-neighborhood',
    name: 'Metropolitan Aerial Submarket',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80',
    category: 'neighborhood',
  },
  {
    id: 'stock-market-skyline',
    name: 'Financial District & Real Estate Skyline',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
    category: 'market',
  },
];

/**
 * Priority 1 & 4: Upload-Only / Curated Real Photography Provider
 * Ensures the application is 100% usable without any generative AI image provider.
 */
export class UploadOnlyProvider implements IImageProvider {
  public id = 'upload-provider';
  public name = 'Authentic Photography (Upload Only)';

  public isConfigured(): boolean {
    return true;
  }

  public async generateConceptImage(
    _prompt: string,
    _aspectRatio: '1:1' | '4:5' | '16:9' | '9:16' = '1:1',
    _contextNotes?: string
  ): Promise<GeneratedImageResult> {
    const randomIndex = Math.floor(Math.random() * CURATED_STOCK_PHOTOS.length);
    const photo = CURATED_STOCK_PHOTOS[randomIndex];

    return {
      id: `sample-photo-${Date.now()}`,
      url: photo.url,
      altText: photo.name,
      isAiIllustrative: false,
      provider: 'authentic_curated_stock',
      metadata: {
        estimatedCostUsd: 0.0,
      },
    };
  }

  public async generateFromBrief(
    brief: ImageCreativeBrief,
    _onProgress?: (step: string, percent: number) => void
  ): Promise<GeneratedImageResult> {
    // If brief purpose matches category, pick matching photo
    const categoryMap: Record<string, string> = {
      hero: 'exterior',
      supporting: 'interior',
      background: 'interior',
      editorial: 'exterior',
      renovation_concept: 'exterior',
      neighborhood_lifestyle: 'neighborhood',
    };

    const targetCategory = categoryMap[brief.purpose] || 'exterior';
    const matches = CURATED_STOCK_PHOTOS.filter((p) => p.category === targetCategory);
    const pool = matches.length > 0 ? matches : CURATED_STOCK_PHOTOS;
    const photo = pool[Math.floor(Math.random() * pool.length)];

    return {
      id: `sample-photo-${Date.now()}`,
      url: photo.url,
      altText: photo.name,
      isAiIllustrative: false,
      provider: 'authentic_curated_stock',
      metadata: {
        modelId: 'curated-stock-fixture',
        prompt: brief.subject,
        estimatedCostUsd: 0.0,
      },
    };
  }
}

// Alias for backwards compatibility
export const UploadImageProvider = UploadOnlyProvider;

/**
 * Priority 3: Gemini Image Engine (Legacy & 0-Quota Fallback)
 */
export class GeminiImageProvider implements IImageProvider {
  public id = 'gemini-image-provider';
  public name = 'Gemini Illustrative Concept Engine';
  private apiKey?: string;
  private modelName: string;
  private uploadFallback: UploadOnlyProvider;

  constructor(apiKey?: string, modelName = 'imagen-3.0-generate-002') {
    this.apiKey = apiKey;
    this.modelName = modelName;
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
    };
    return this.generateFromBrief(brief);
  }

  public async generateFromBrief(
    brief: ImageCreativeBrief,
    onProgress?: (step: string, percent: number) => void
  ): Promise<GeneratedImageResult> {
    if (!this.isConfigured()) {
      return this.uploadFallback.generateFromBrief(brief);
    }

    const startTime = Date.now();
    const refinedPrompt = CreativeBriefComposer.briefToPrompt(brief);

    try {
      onProgress?.('Generating visual concept with Gemini Image...', 40);
      const ai = new GoogleGenAI({ apiKey: this.apiKey! });

      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: refinedPrompt,
      });

      const candidates = (response as any).candidates;
      if (candidates && candidates[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const base64Url = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            const latencyMs = Date.now() - startTime;

            UsageTracker.recordUsage({
              provider: 'gemini_image',
              model: this.modelName,
              operation: 'general_generation',
              success: true,
              latencyMs,
            });

            return {
              id: `gemini-img-${Date.now()}`,
              url: base64Url,
              altText: `AI Illustrative Concept: ${brief.subject}`,
              isAiIllustrative: true,
              provider: 'gemini_image',
              metadata: {
                modelId: this.modelName,
                prompt: refinedPrompt,
                latencyMs,
                estimatedCostUsd: 0.0,
              },
            };
          }
        }
      }

      console.info('Gemini image model returned no inline data. Using authentic photography fixture.');
      return this.uploadFallback.generateFromBrief(brief);
    } catch (err) {
      console.warn('Gemini image generation unavailable under current quota (0 RPD). Falling back to authentic photo fixture:', err);
      return this.uploadFallback.generateFromBrief(brief);
    }
  }
}

/**
 * Unified Image Provider Router
 * Resolves appropriate adapter based on settings, tiers, and spending limits.
 */
export class ImageProviderRouter {
  public static getAdapterForConfig(config: ProviderConfig): IImageProvider {
    const limits = config.imageSpendingLimits;

    // If paid generation is enabled and a paid provider is configured:
    if (limits?.enablePaidGeneration) {
      if (limits.preferredPaidProvider === 'bfl' && config.bflApiKey) {
        return new BflImageProvider(config.bflApiKey, limits.preferredPaidModel || 'flux-2-pro', config.bflBaseUrl);
      }
      if (limits.preferredPaidProvider === 'gemini_image' && config.geminiApiKey) {
        return new GeminiPaidImageProvider(config.geminiApiKey, limits.preferredPaidModel || 'nano-banana-pro');
      }
      if (limits.preferredPaidProvider === 'openai_image' && config.openaiApiKey) {
        return new OpenAiImageProvider(config.openaiApiKey, limits.preferredPaidModel || 'gpt-image-2', config.openaiBaseUrl);
      }
    }

    // Default to Free / Dev: NVIDIA NIM or Uploads
    if (config.nvidiaApiKey) {
      return new NvidiaImageProvider(config.nvidiaApiKey, config.nvidiaModelId || 'stabilityai/sdxl-turbo', config.nvidiaBaseUrl);
    }

    return new UploadOnlyProvider();
  }
}
