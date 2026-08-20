import { 
  IAIProvider, 
  GenerationProgressCallback, 
  GenerationOptions, 
  FullKitGenerationResult, 
  GenerationMetadata 
} from '../../types/providers';
import { CampaignSourceData, CampaignStrategy, CampaignCopy, CopyQualityReport } from '../../types/campaign';
import { BrandKit } from '../../types/brandKit';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { GeminiProvider } from './geminiProvider';
import { MockAIProvider } from './mockProvider';
import { AntiSlopCritic } from '../marketing/antiSlopCritic';
import { SettingsStore } from '../storage/settingsStore';
import { ModelRegistry } from './modelRegistry';

export class SupabaseFunctionsProvider implements IAIProvider {
  public id = 'supabase_edge';
  public name = 'Supabase Edge Functions';

  private fallbackProvider: IAIProvider;

  constructor() {
    const config = SettingsStore.get();
    if (config.geminiApiKey) {
      this.fallbackProvider = new GeminiProvider(config.geminiApiKey, config.defaultModelId);
    } else {
      this.fallbackProvider = new MockAIProvider();
    }
  }

  public isConfigured(): boolean {
    return isSupabaseConfigured();
  }

  public async generateFullMarketingKit(
    sourceData: CampaignSourceData,
    brandKit: BrandKit,
    onProgress?: GenerationProgressCallback,
    options?: GenerationOptions
  ): Promise<FullKitGenerationResult> {
    if (!isSupabaseConfigured()) {
      return this.fallbackProvider.generateFullMarketingKit(sourceData, brandKit, onProgress, options);
    }

    const config = SettingsStore.get();
    const { modelId, thinkingLevel } = ModelRegistry.resolveModelForOperation('campaign_kit', config);
    const targetModel = options?.modelId || modelId;

    onProgress?.('Contacting Supabase Edge Function: generate-copy (Full Kit Mode)...', 25);

    try {
      const { data, error } = await supabase.functions.invoke('generate-copy', {
        body: { 
          sourceData, 
          brandKit,
          isFullKit: true,
          modelId: targetModel,
          thinkingLevel: options?.thinkingLevel || thinkingLevel,
        },
      });

      if (error || !data?.strategy || !data?.copy) {
        console.warn('Edge function error or missing full kit payload, using client fallback', error);
        return this.fallbackProvider.generateFullMarketingKit(sourceData, brandKit, onProgress, options);
      }

      const metadata: GenerationMetadata = {
        requestedModel: targetModel,
        actualModel: data.model || targetModel,
        fallbackOccurred: Boolean(data.fallbackOccurred),
        fallbackReason: data.fallbackReason,
        latencyMs: data.latencyMs || 800,
        timestamp: new Date().toISOString(),
      };

      data.strategy.generationMetadata = metadata;
      data.copy.generationMetadata = metadata;

      onProgress?.('Full Marketing Kit generated successfully.', 100);
      return {
        strategy: data.strategy,
        copy: data.copy,
        metadata,
      };
    } catch (e) {
      console.warn('Failed to invoke Supabase Edge Function, using client fallback', e);
      return this.fallbackProvider.generateFullMarketingKit(sourceData, brandKit, onProgress, options);
    }
  }

  public async generateStrategy(
    sourceData: CampaignSourceData,
    brandKit: BrandKit,
    onProgress?: GenerationProgressCallback,
    options?: GenerationOptions
  ): Promise<CampaignStrategy> {
    if (!isSupabaseConfigured()) {
      return this.fallbackProvider.generateStrategy(sourceData, brandKit, onProgress, options);
    }

    const config = SettingsStore.get();
    const { modelId, thinkingLevel } = ModelRegistry.resolveModelForOperation('campaign_strategy', config);
    const targetModel = options?.modelId || modelId;

    onProgress?.('Contacting Supabase Edge Function: generate-campaign-strategy...', 20);

    try {
      const { data, error } = await supabase.functions.invoke('generate-campaign-strategy', {
        body: { 
          sourceData, 
          brandKit,
          modelId: targetModel,
          thinkingLevel: options?.thinkingLevel || thinkingLevel,
        },
      });

      if (error || !data?.strategy) {
        console.warn('Edge function returned error, falling back to client provider', error);
        return this.fallbackProvider.generateStrategy(sourceData, brandKit, onProgress, options);
      }

      onProgress?.('Strategy synthesized successfully.', 100);
      return data.strategy;
    } catch (e) {
      console.warn('Failed to invoke Supabase Edge Function, using fallback', e);
      return this.fallbackProvider.generateStrategy(sourceData, brandKit, onProgress, options);
    }
  }

  public async generateCopy(
    sourceData: CampaignSourceData,
    strategy: CampaignStrategy,
    brandKit: BrandKit,
    onProgress?: GenerationProgressCallback,
    options?: GenerationOptions
  ): Promise<CampaignCopy> {
    if (!isSupabaseConfigured()) {
      return this.fallbackProvider.generateCopy(sourceData, strategy, brandKit, onProgress, options);
    }

    const config = SettingsStore.get();
    const { modelId, thinkingLevel } = ModelRegistry.resolveModelForOperation('platform_variants', config);
    const targetModel = options?.modelId || modelId;

    onProgress?.('Contacting Supabase Edge Function: generate-copy...', 30);

    try {
      const { data, error } = await supabase.functions.invoke('generate-copy', {
        body: { 
          sourceData, 
          strategy, 
          brandKit,
          modelId: targetModel,
          thinkingLevel: options?.thinkingLevel || thinkingLevel,
        },
      });

      if (error || !data?.copy) {
        console.warn('Edge function error, falling back to client provider', error);
        return this.fallbackProvider.generateCopy(sourceData, strategy, brandKit, onProgress, options);
      }

      onProgress?.('Copy generated successfully.', 100);
      return data.copy;
    } catch (e) {
      console.warn('Failed to invoke Supabase Edge Function, using fallback', e);
      return this.fallbackProvider.generateCopy(sourceData, strategy, brandKit, onProgress, options);
    }
  }

  public async reviewCopyQuality(
    copy: CampaignCopy,
    sourceData: CampaignSourceData,
    brandKit: BrandKit,
    options?: GenerationOptions
  ): Promise<CopyQualityReport> {
    return AntiSlopCritic.reviewCampaignCopy(copy, sourceData, brandKit);
  }
}
