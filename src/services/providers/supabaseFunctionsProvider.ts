import { IAIProvider, GenerationProgressCallback } from '../../types/providers';
import { CampaignSourceData, CampaignStrategy, CampaignCopy, CopyQualityReport } from '../../types/campaign';
import { BrandKit } from '../../types/brandKit';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { GeminiProvider } from './geminiProvider';
import { MockAIProvider } from './mockProvider';
import { AntiSlopCritic } from '../marketing/antiSlopCritic';
import { SettingsStore } from '../storage/settingsStore';

export class SupabaseFunctionsProvider implements IAIProvider {
  public id = 'supabase_edge';
  public name = 'Supabase Edge Functions';

  private fallbackProvider: IAIProvider;

  constructor() {
    const config = SettingsStore.get();
    if (config.geminiApiKey) {
      this.fallbackProvider = new GeminiProvider(config.geminiApiKey, config.geminiModel);
    } else {
      this.fallbackProvider = new MockAIProvider();
    }
  }

  public isConfigured(): boolean {
    return isSupabaseConfigured();
  }

  public async generateStrategy(
    sourceData: CampaignSourceData,
    brandKit: BrandKit,
    onProgress?: GenerationProgressCallback
  ): Promise<CampaignStrategy> {
    if (!isSupabaseConfigured()) {
      return this.fallbackProvider.generateStrategy(sourceData, brandKit, onProgress);
    }

    onProgress?.('Contacting Supabase Edge Function: generate-campaign-strategy...', 20);

    try {
      const { data, error } = await supabase.functions.invoke('generate-campaign-strategy', {
        body: { sourceData, brandKit },
      });

      if (error || !data?.strategy) {
        console.warn('Edge function returned error, falling back to client provider', error);
        return this.fallbackProvider.generateStrategy(sourceData, brandKit, onProgress);
      }

      onProgress?.('Strategy synthesized successfully.', 100);
      return data.strategy;
    } catch (e) {
      console.warn('Failed to invoke Supabase Edge Function, using fallback', e);
      return this.fallbackProvider.generateStrategy(sourceData, brandKit, onProgress);
    }
  }

  public async generateCopy(
    sourceData: CampaignSourceData,
    strategy: CampaignStrategy,
    brandKit: BrandKit,
    onProgress?: GenerationProgressCallback
  ): Promise<CampaignCopy> {
    if (!isSupabaseConfigured()) {
      return this.fallbackProvider.generateCopy(sourceData, strategy, brandKit, onProgress);
    }

    onProgress?.('Contacting Supabase Edge Function: generate-copy...', 30);

    try {
      const { data, error } = await supabase.functions.invoke('generate-copy', {
        body: { sourceData, strategy, brandKit },
      });

      if (error || !data?.copy) {
        console.warn('Edge function error, falling back to client provider', error);
        return this.fallbackProvider.generateCopy(sourceData, strategy, brandKit, onProgress);
      }

      onProgress?.('Copy generated successfully.', 100);
      return data.copy;
    } catch (e) {
      console.warn('Failed to invoke Supabase Edge Function, using fallback', e);
      return this.fallbackProvider.generateCopy(sourceData, strategy, brandKit, onProgress);
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
