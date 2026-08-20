import { describe, it, expect } from 'vitest';
import { ImageProviderRegistry, IMAGE_MODELS } from '../services/providers/imageProviderRegistry';
import { CreativeBriefComposer } from '../services/providers/creativeBriefComposer';
import { ImageCreativeBrief, ProviderConfig } from '../types/providers';
import { CampaignSourceData } from '../types/campaign';
import { DEFAULT_BRAND_KIT } from '../types/brandKit';

describe('Image Provider Registry, Quality Tiers & Creative Brief Composer', () => {
  it('should register all expected free, paid, and future image providers', () => {
    const providers = ImageProviderRegistry.getAllProviders();
    const providerIds = providers.map((p) => p.providerId);

    expect(providerIds).toContain('upload');
    expect(providerIds).toContain('nvidia');
    expect(providerIds).toContain('bfl');
    expect(providerIds).toContain('gemini_image');
    expect(providerIds).toContain('openai_image');
  });

  it('should define FLUX.2 Pro, FLUX.2 Max, and FLUX.2 Flex with correct cost estimates and tiers', () => {
    const fluxPro = IMAGE_MODELS['flux-2-pro'];
    const fluxMax = IMAGE_MODELS['flux-2-max'];
    const fluxFlex = IMAGE_MODELS['flux-2-flex'];

    expect(fluxPro.tier).toBe('paid_standard');
    expect(fluxPro.estimatedCostUsd).toBe(0.05);
    expect(fluxPro.supportsMultipleReferences).toBe(true);

    expect(fluxMax.tier).toBe('paid_maximum');
    expect(fluxMax.userLabel).toContain('Maximum Quality');
    expect(fluxMax.estimatedCostUsd).toBe(0.08);

    expect(fluxFlex.tier).toBe('paid_specialized');
    expect(fluxFlex.estimatedCostUsd).toBe(0.06);
  });

  it('should define Gemini Nano Banana Pro as a paid alternate with multimodal grounding', () => {
    const nanoBanana = IMAGE_MODELS['nano-banana-pro'];
    expect(nanoBanana.tier).toBe('paid_alternate');
    expect(nanoBanana.estimatedCostUsd).toBe(0.04);
    expect(nanoBanana.supportsGrounding).toBe(true);
    expect(nanoBanana.supportsBrandColorControl).toBe(true);
  });

  it('should strictly force free/dev tier when enablePaidGeneration is false', () => {
    const config: ProviderConfig = {
      aiProvider: 'gemini',
      defaultModelId: 'gemini-3.5-flash-lite',
      geminiModel: 'gemini-3.5-flash-lite',
      fallbackModelId: 'gemini-3.1-flash-lite',
      premiumModelId: 'gemini-3.7-flash',
      imageProvider: 'bfl',
      imageQualityTier: 'paid_maximum',
      geminiImageModel: 'nano-banana-pro',
      geminiImageQuotaAvailable: false,
      nvidiaModelId: 'stabilityai/sdxl-turbo',
      imageSpendingLimits: {
        enablePaidGeneration: false, // OFF
        preferredPaidProvider: 'bfl',
        preferredPaidModel: 'flux-2-max',
        maxImagesPerCampaign: 5,
        dailySpendingLimitUsd: 5.0,
        monthlySpendingLimitUsd: 50.0,
      },
      useMockFallback: true,
    };

    const brief: ImageCreativeBrief = {
      purpose: 'hero',
      subject: 'Luxury modern villa',
      aspectRatio: '1:1',
      qualityTier: 'paid_maximum',
    };

    const resolved = ImageProviderRegistry.resolveProviderForBrief(brief, config);
    expect(resolved.isPaid).toBe(false);
    expect(resolved.estimatedCostUsd).toBe(0.0);
    expect(['nvidia', 'upload']).toContain(resolved.providerId);
  });

  it('should resolve FLUX.2 Max for hero and FLUX.2 Pro for supporting in auto mode when paid is enabled', () => {
    const config: ProviderConfig = {
      aiProvider: 'gemini',
      defaultModelId: 'gemini-3.5-flash-lite',
      geminiModel: 'gemini-3.5-flash-lite',
      fallbackModelId: 'gemini-3.1-flash-lite',
      premiumModelId: 'gemini-3.7-flash',
      imageProvider: 'bfl',
      imageQualityTier: 'auto',
      geminiImageModel: 'nano-banana-pro',
      geminiImageQuotaAvailable: false,
      nvidiaModelId: 'stabilityai/sdxl-turbo',
      imageSpendingLimits: {
        enablePaidGeneration: true,
        preferredPaidProvider: 'bfl',
        preferredPaidModel: 'flux-2-max',
        maxImagesPerCampaign: 5,
        dailySpendingLimitUsd: 5.0,
        monthlySpendingLimitUsd: 50.0,
      },
      useMockFallback: true,
    };

    const heroBrief: ImageCreativeBrief = {
      purpose: 'hero',
      subject: 'Exterior front elevation',
      aspectRatio: '16:9',
      qualityTier: 'auto',
    };
    const resolvedHero = ImageProviderRegistry.resolveProviderForBrief(heroBrief, config);
    expect(resolvedHero.isPaid).toBe(true);
    expect(resolvedHero.modelId).toBe('flux-2-max');
    expect(resolvedHero.estimatedCostUsd).toBe(0.08);

    const supportingBrief: ImageCreativeBrief = {
      purpose: 'supporting',
      subject: 'Kitchen remodel',
      aspectRatio: '1:1',
      qualityTier: 'auto',
    };
    const resolvedSupporting = ImageProviderRegistry.resolveProviderForBrief(supportingBrief, config);
    expect(resolvedSupporting.isPaid).toBe(true);
    expect(resolvedSupporting.modelId).toBe('flux-2-pro');
    expect(resolvedSupporting.estimatedCostUsd).toBe(0.05);
  });

  it('should compose structured creative briefs from property and brand context', () => {
    const sourceData: CampaignSourceData = {
      campaignType: 'fix_and_flip',
      title: 'Midtown Value-Add',
      targetMarket: 'Scottsdale, AZ',
      property: {
        address: '4502 N Camelback Rd',
        city: 'Scottsdale',
        state: 'AZ',
        neighborhood: 'Old Town',
        propertyType: 'single_family',
        financials: { purchasePrice: 500000, arv: 720000 },
        investmentThesis: 'Cosmetic flip',
        dealHighlights: ['Spread: $220k'],
      },
      uploadedImages: [],
    };

    const brief = CreativeBriefComposer.composeBrief({
      sourceData,
      brandKit: DEFAULT_BRAND_KIT,
      purpose: 'hero',
      style: 'dusk_luxury',
      aspectRatio: '16:9',
    });

    expect(brief.purpose).toBe('hero');
    expect(brief.subject).toContain('Old Town, Scottsdale');
    expect(brief.style).toBe('dusk_luxury');
    expect(brief.brandColors).toBeDefined();
    expect(brief.brandColors!.length).toBeGreaterThan(0);

    const prompt = CreativeBriefComposer.briefToPrompt(brief);
    expect(prompt).toContain('Twilight architectural lighting');
    expect(prompt).toContain('Photorealistic 8k commercial real estate imagery');
  });
});
