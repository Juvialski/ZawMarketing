/**
 * Centralized Image Provider & Model Registry
 * Supports Free/Dev, Paid Standard, Paid Maximum Quality, Paid Specialized, and Paid Alternate.
 */

import { 
  ImageProviderType, 
  ImageQualityTier, 
  ImageProviderDefinition,
  ImageCreativeBrief,
  ProviderConfig
} from '../../types/providers';

export interface ImageModelCatalogItem {
  id: string;
  providerId: ImageProviderType;
  displayName: string;
  userLabel: string;
  tier: ImageQualityTier;
  estimatedCostUsd: number;
  supportsMultipleReferences: boolean;
  supportsEditing: boolean;
  supportsHighResolution: boolean;
  supportsBrandColorControl: boolean;
  supportsGrounding: boolean;
  recommendedFor: string;
  description: string;
}

export const IMAGE_PROVIDER_DEFINITIONS: Record<ImageProviderType, ImageProviderDefinition> = {
  upload: {
    providerId: 'upload',
    displayName: 'Authentic Photography (Upload-Only)',
    tier: 'free_dev',
    models: ['authentic-real-upload', 'curated-stock-fixture'],
    supportsTextToImage: false,
    supportsEditing: false,
    supportsMultipleReferences: true,
    supportsHighResolution: true,
    supportsBrandColorControl: false,
    supportsGrounding: true,
    estimatedCostPerImageUsd: 0.0,
    active: true,
    configured: true,
    description: 'Real uploaded property photography and authentic curated architectural stock photos.',
  },
  nvidia: {
    providerId: 'nvidia',
    displayName: 'NVIDIA NIM Visual Engine (Free / Dev)',
    tier: 'free_dev',
    models: [
      'stabilityai/sdxl-turbo',
      'black-forest-labs/flux-1-schnell',
      'stabilityai/stable-diffusion-3-medium',
    ],
    supportsTextToImage: true,
    supportsEditing: false,
    supportsMultipleReferences: false,
    supportsHighResolution: false,
    supportsBrandColorControl: false,
    supportsGrounding: false,
    estimatedCostPerImageUsd: 0.0,
    active: true,
    configured: true,
    description: 'Fast, free development visual concepts and background textures via NVIDIA NIM hosted endpoints.',
  },
  bfl: {
    providerId: 'bfl',
    displayName: 'Black Forest Labs (FLUX.2)',
    tier: 'paid_standard',
    models: ['flux-2-pro', 'flux-2-max', 'flux-2-flex'],
    supportsTextToImage: true,
    supportsEditing: true,
    supportsMultipleReferences: true,
    supportsHighResolution: true,
    supportsBrandColorControl: true,
    supportsGrounding: true,
    estimatedCostPerImageUsd: 0.05,
    active: true,
    configured: false,
    description: 'Premier photorealistic generation engine with multi-reference composition and exact hex-color guidance.',
  },
  gemini_image: {
    providerId: 'gemini_image',
    displayName: 'Google Gemini Image Engine',
    tier: 'paid_alternate',
    models: [
      'nano-banana-pro',
      'nano-banana-2',
      'nano-banana-2-lite',
      'imagen-3.0-generate-002',
    ],
    supportsTextToImage: true,
    supportsEditing: true,
    supportsMultipleReferences: true,
    supportsHighResolution: true,
    supportsBrandColorControl: true,
    supportsGrounding: true,
    estimatedCostPerImageUsd: 0.04,
    active: true,
    configured: false,
    description: 'Google multimodal visual engine with deep prompt understanding and brand asset grounding.',
  },
  openai_image: {
    providerId: 'openai_image',
    displayName: 'OpenAI GPT Image Engine (Future)',
    tier: 'paid_standard',
    models: ['gpt-image-2', 'dall-e-3'],
    supportsTextToImage: true,
    supportsEditing: true,
    supportsMultipleReferences: false,
    supportsHighResolution: true,
    supportsBrandColorControl: false,
    supportsGrounding: false,
    estimatedCostPerImageUsd: 0.06,
    active: false,
    configured: false,
    description: 'OpenAI image generation adapter ready for future enterprise account connection.',
  },
  mock: {
    providerId: 'mock',
    displayName: 'Mock Visual Fixture',
    tier: 'free_dev',
    models: ['mock-architectural-fixture'],
    supportsTextToImage: true,
    supportsEditing: false,
    supportsMultipleReferences: true,
    supportsHighResolution: true,
    supportsBrandColorControl: true,
    supportsGrounding: true,
    estimatedCostPerImageUsd: 0.0,
    active: true,
    configured: true,
    description: 'High-resolution offline mock photo fixtures for zero-key local testing.',
  },
};

export const IMAGE_MODELS: Record<string, ImageModelCatalogItem> = {
  // Free / Dev Models
  'stabilityai/sdxl-turbo': {
    id: 'stabilityai/sdxl-turbo',
    providerId: 'nvidia',
    displayName: 'SDXL Turbo (NVIDIA)',
    userLabel: 'Free · Fast Development',
    tier: 'free_dev',
    estimatedCostUsd: 0.0,
    supportsMultipleReferences: false,
    supportsEditing: false,
    supportsHighResolution: false,
    supportsBrandColorControl: false,
    supportsGrounding: false,
    recommendedFor: 'Routine background textures, preliminary draft concepts',
    description: 'Ultra-fast sub-second generation for rapid prototyping.',
  },
  'black-forest-labs/flux-1-schnell': {
    id: 'black-forest-labs/flux-1-schnell',
    providerId: 'nvidia',
    displayName: 'FLUX.1 Schnell (NVIDIA)',
    userLabel: 'Free · Quality Concept',
    tier: 'free_dev',
    estimatedCostUsd: 0.0,
    supportsMultipleReferences: false,
    supportsEditing: false,
    supportsHighResolution: false,
    supportsBrandColorControl: false,
    supportsGrounding: false,
    recommendedFor: 'General social post visual concepts',
    description: 'High quality 4-step generation hosted on NVIDIA NIM.',
  },

  // Paid Standard (BFL)
  'flux-2-pro': {
    id: 'flux-2-pro',
    providerId: 'bfl',
    displayName: 'FLUX.2 Pro',
    userLabel: 'Professional · Production Standard',
    tier: 'paid_standard',
    estimatedCostUsd: 0.05,
    supportsMultipleReferences: true,
    supportsEditing: true,
    supportsHighResolution: true,
    supportsBrandColorControl: true,
    supportsGrounding: true,
    recommendedFor: 'Production social imagery, supporting campaign visuals, editorial assets',
    description: 'High-volume production standard with multi-reference styling and fast latency.',
  },

  // Paid Maximum Quality (BFL)
  'flux-2-max': {
    id: 'flux-2-max',
    providerId: 'bfl',
    displayName: 'FLUX.2 Max',
    userLabel: 'Maximum Quality · Photorealistic Hero',
    tier: 'paid_maximum',
    estimatedCostUsd: 0.08,
    supportsMultipleReferences: true,
    supportsEditing: true,
    supportsHighResolution: true,
    supportsBrandColorControl: true,
    supportsGrounding: true,
    recommendedFor: 'Final hero imagery, high-value client presentations, advertising creatives',
    description: 'Maximum quality photorealistic engine with advanced architectural detail and lighting precision.',
  },

  // Paid Specialized (BFL)
  'flux-2-flex': {
    id: 'flux-2-flex',
    providerId: 'bfl',
    displayName: 'FLUX.2 Flex',
    userLabel: 'Specialized · Fine Control',
    tier: 'paid_specialized',
    estimatedCostUsd: 0.06,
    supportsMultipleReferences: true,
    supportsEditing: true,
    supportsHighResolution: true,
    supportsBrandColorControl: true,
    supportsGrounding: true,
    recommendedFor: 'Complex spatial composition and precise visual asset control',
    description: 'Specialized architectural control adapter with fine typography inside raw imagery where required.',
  },

  // Paid Alternate (Gemini Image)
  'nano-banana-pro': {
    id: 'nano-banana-pro',
    providerId: 'gemini_image',
    displayName: 'Gemini Nano Banana Pro',
    userLabel: 'Alternative Premium · Multimodal Consistency',
    tier: 'paid_alternate',
    estimatedCostUsd: 0.04,
    supportsMultipleReferences: true,
    supportsEditing: true,
    supportsHighResolution: true,
    supportsBrandColorControl: true,
    supportsGrounding: true,
    recommendedFor: 'Brand-grounded assets, iterative creative adjustments',
    description: 'Google flagship multimodal visual generator with deep brand asset grounding.',
  },
  'nano-banana-2': {
    id: 'nano-banana-2',
    providerId: 'gemini_image',
    displayName: 'Gemini Nano Banana 2',
    userLabel: 'Alternative Standard',
    tier: 'paid_standard',
    estimatedCostUsd: 0.03,
    supportsMultipleReferences: true,
    supportsEditing: true,
    supportsHighResolution: false,
    supportsBrandColorControl: true,
    supportsGrounding: false,
    recommendedFor: 'Supporting visual concepts',
    description: 'Fast Google visual model for routine concepts.',
  },

  // Future OpenAI
  'gpt-image-2': {
    id: 'gpt-image-2',
    providerId: 'openai_image',
    displayName: 'GPT Image 2',
    userLabel: 'Future Adapter',
    tier: 'paid_standard',
    estimatedCostUsd: 0.06,
    supportsMultipleReferences: false,
    supportsEditing: true,
    supportsHighResolution: true,
    supportsBrandColorControl: false,
    supportsGrounding: false,
    recommendedFor: 'Future enterprise OpenAI integration',
    description: 'OpenAI next-generation image generation model.',
  },
};

export class ImageProviderRegistry {
  /**
   * Returns all registered image providers.
   */
  public static getAllProviders(): ImageProviderDefinition[] {
    return Object.values(IMAGE_PROVIDER_DEFINITIONS);
  }

  /**
   * Returns a specific image provider definition.
   */
  public static getProvider(id: ImageProviderType): ImageProviderDefinition {
    return IMAGE_PROVIDER_DEFINITIONS[id] || IMAGE_PROVIDER_DEFINITIONS.upload;
  }

  /**
   * Returns all models belonging to a specific tier.
   */
  public static getModelsByTier(tier: ImageQualityTier): ImageModelCatalogItem[] {
    return Object.values(IMAGE_MODELS).filter((m) => m.tier === tier);
  }

  /**
   * Resolves the appropriate provider and model for a creative brief.
   * Enforces that paid models are NEVER selected if enablePaidGeneration is false.
   */
  public static resolveProviderForBrief(
    brief: ImageCreativeBrief,
    config: ProviderConfig
  ): {
    providerId: ImageProviderType;
    modelId: string;
    isPaid: boolean;
    estimatedCostUsd: number;
  } {
    const limits = config.imageSpendingLimits;
    const requestedTier = brief.qualityTier || config.imageQualityTier || 'free_dev';

    // If paid generation is disabled in settings, strictly force free / dev route
    if (!limits?.enablePaidGeneration) {
      return {
        providerId: config.nvidiaApiKey ? 'nvidia' : 'upload',
        modelId: config.nvidiaModelId || 'stabilityai/sdxl-turbo',
        isPaid: false,
        estimatedCostUsd: 0.0,
      };
    }

    // Auto routing based on purpose
    if (requestedTier === 'auto') {
      if (brief.purpose === 'hero') {
        return {
          providerId: limits.preferredPaidProvider || 'bfl',
          modelId: 'flux-2-max',
          isPaid: true,
          estimatedCostUsd: IMAGE_MODELS['flux-2-max']?.estimatedCostUsd || 0.08,
        };
      }
      if (brief.purpose === 'supporting' || brief.purpose === 'editorial') {
        return {
          providerId: limits.preferredPaidProvider || 'bfl',
          modelId: 'flux-2-pro',
          isPaid: true,
          estimatedCostUsd: IMAGE_MODELS['flux-2-pro']?.estimatedCostUsd || 0.05,
        };
      }
      // Routine background or lifestyle
      return {
        providerId: 'nvidia',
        modelId: config.nvidiaModelId || 'stabilityai/sdxl-turbo',
        isPaid: false,
        estimatedCostUsd: 0.0,
      };
    }

    // Explicit tier selection
    switch (requestedTier) {
      case 'paid_maximum':
        return {
          providerId: 'bfl',
          modelId: 'flux-2-max',
          isPaid: true,
          estimatedCostUsd: 0.08,
        };
      case 'paid_standard':
        return {
          providerId: 'bfl',
          modelId: 'flux-2-pro',
          isPaid: true,
          estimatedCostUsd: 0.05,
        };
      case 'paid_specialized':
        return {
          providerId: 'bfl',
          modelId: 'flux-2-flex',
          isPaid: true,
          estimatedCostUsd: 0.06,
        };
      case 'paid_alternate':
        return {
          providerId: 'gemini_image',
          modelId: 'nano-banana-pro',
          isPaid: true,
          estimatedCostUsd: 0.04,
        };
      case 'free_dev':
      default:
        return {
          providerId: config.nvidiaApiKey ? 'nvidia' : 'upload',
          modelId: config.nvidiaModelId || 'stabilityai/sdxl-turbo',
          isPaid: false,
          estimatedCostUsd: 0.0,
        };
    }
  }

  /**
   * Computes estimated cost for a given tier or model.
   */
  public static getCostEstimate(modelIdOrTier: string): number {
    if (IMAGE_MODELS[modelIdOrTier]) {
      return IMAGE_MODELS[modelIdOrTier].estimatedCostUsd;
    }
    if (modelIdOrTier === 'paid_maximum') return 0.08;
    if (modelIdOrTier === 'paid_standard') return 0.05;
    if (modelIdOrTier === 'paid_specialized') return 0.06;
    if (modelIdOrTier === 'paid_alternate') return 0.04;
    return 0.0;
  }
}
