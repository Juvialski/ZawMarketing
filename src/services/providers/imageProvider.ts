import {
  GeneratedImageResult,
  IImageProvider,
  ImageCreativeBrief,
  ProviderConfig,
} from '../../types/providers';
import { isSupabaseConfigured, supabase } from '../supabase/client';
import { ImageProviderRegistry } from './imageProviderRegistry';

export const CURATED_STOCK_PHOTOS = [
  {
    id: 'demo-fictional-exterior',
    name: 'Fictional Demo Property Exterior',
    url: '/demo/fictional-property-exterior.png',
    category: 'exterior',
  },
  {
    id: 'demo-fictional-interior',
    name: 'Fictional Demo Property Interior',
    url: '/demo/fictional-property-interior.png',
    category: 'interior',
  },
] as const;

/**
 * Deterministic, explicitly fictional fixtures for demo/offline mode only.
 */
export class UploadOnlyProvider implements IImageProvider {
  public id = 'demo-fixture-provider';
  public name = 'Fictional Demo Photography';

  public isConfigured(): boolean {
    return true;
  }

  public async generateConceptImage(
    prompt: string,
    aspectRatio: '1:1' | '4:5' | '16:9' | '9:16' = '1:1'
  ): Promise<GeneratedImageResult> {
    return this.generateFromBrief({
      purpose: 'hero',
      subject: prompt,
      aspectRatio,
      isConceptual: true,
    });
  }

  public async generateFromBrief(brief: ImageCreativeBrief): Promise<GeneratedImageResult> {
    const interiorPurposes = new Set(['supporting', 'background', 'renovation_concept']);
    const photo = interiorPurposes.has(brief.purpose)
      ? CURATED_STOCK_PHOTOS[1]
      : CURATED_STOCK_PHOTOS[0];

    return {
      id: `${photo.id}-${brief.purpose}`,
      url: photo.url,
      altText: `${photo.name} — demo fixture, not a real listing`,
      isAiIllustrative: true,
      provider: 'demo_fixture',
      provenance: 'fixture',
      metadata: {
        modelId: 'bundled-fictional-fixture',
        prompt: brief.subject,
        estimatedCostUsd: 0,
      },
    };
  }
}

interface EdgeImageContext {
  campaignId?: string;
  organizationId?: string;
}

interface EdgeImageResponse {
  assetId?: string;
  signedUrl?: string;
  storageBucket?: string;
  storagePath?: string;
  asset?: {
    id?: string;
    accessUrl?: string;
    signedUrl?: string;
    storagePath?: string;
  };
  url?: string;
  provider?: string;
  model?: string;
  estimatedCostUsd?: number;
  provenance?: 'generated' | 'uploaded' | 'fixture' | 'fallback' | 'failed';
  isAiIllustrative?: boolean;
}

/**
 * The browser sends an authenticated request to the application backend. It
 * never receives or uses a provider credential and never falls back to a live
 * provider in browser JavaScript.
 */
export class SupabaseEdgeImageProvider implements IImageProvider {
  public id = 'supabase-edge-image';
  public name = 'Secure Server Image Generation';

  constructor(
    private readonly config: ProviderConfig,
    private readonly context: EdgeImageContext = {}
  ) {}

  public isConfigured(): boolean {
    return isSupabaseConfigured();
  }

  public async generateConceptImage(
    prompt: string,
    aspectRatio: '1:1' | '4:5' | '16:9' | '9:16' = '1:1',
    contextNotes?: string
  ): Promise<GeneratedImageResult> {
    return this.generateFromBrief({
      purpose: 'hero',
      subject: prompt,
      aspectRatio,
      constraints: contextNotes,
      isConceptual: true,
      qualityTier: this.config.imageQualityTier,
    });
  }

  public async generateFromBrief(
    brief: ImageCreativeBrief,
    onProgress?: (step: string, percent: number) => void
  ): Promise<GeneratedImageResult> {
    if (!this.isConfigured()) {
      throw new Error('Live image generation requires the authenticated backend.');
    }

    const resolved = ImageProviderRegistry.resolveProviderForBrief(brief, this.config);
    onProgress?.('Requesting secure server-side image generation...', 35);

    const { data, error } = await supabase.functions.invoke<EdgeImageResponse>('generate-image', {
      body: {
        brief,
        provider: resolved.providerId,
        model: resolved.modelId,
        campaignId: this.context.campaignId,
        organizationId: this.context.organizationId,
        idempotencyKey: crypto.randomUUID(),
      },
    });

    if (error) {
      throw new Error('Image generation backend is unavailable. No paid fallback was attempted.');
    }

    const url = data?.asset?.accessUrl || data?.asset?.signedUrl || data?.signedUrl || data?.url;
    if (!data || data.provenance === 'failed' || !url) {
      throw new Error('The image provider did not produce a persisted image asset.');
    }

    onProgress?.('Image persisted to private workspace storage.', 100);
    return {
      id: data.asset?.id || data.assetId || `server-image-${Date.now()}`,
      url,
      altText: `${brief.purpose} conceptual image — ${brief.subject}`,
      isAiIllustrative: data.isAiIllustrative ?? true,
      provider: data.provider || resolved.providerId,
      provenance: data.provenance || 'generated',
      storageBucket: data.storageBucket,
      storagePath: data.storagePath || data.asset?.storagePath,
      costMetadata: {
        estimatedCostUsd: data.estimatedCostUsd || 0,
        provider: data.provider || resolved.providerId,
        model: data.model || resolved.modelId,
        resolution: brief.aspectRatio,
        isEstimated: true,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        modelId: data.model || resolved.modelId,
        prompt: brief.subject,
        estimatedCostUsd: data.estimatedCostUsd || 0,
      },
    };
  }
}

// Backwards-compatible names now resolve only to the safe fixture adapter.
export const UploadImageProvider = UploadOnlyProvider;
export const GeminiImageProvider = SupabaseEdgeImageProvider;

export class ImageProviderRouter {
  public static getAdapterForConfig(
    config: ProviderConfig,
    context: EdgeImageContext = {}
  ): IImageProvider {
    if (isSupabaseConfigured()) {
      return new SupabaseEdgeImageProvider(config, context);
    }

    return new UploadOnlyProvider();
  }
}
