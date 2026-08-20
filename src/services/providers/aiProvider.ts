import { IAIProvider, IImageProvider } from '../../types/providers';
import { GeminiProvider } from './geminiProvider';
import { MockAIProvider } from './mockProvider';
import { SupabaseFunctionsProvider } from './supabaseFunctionsProvider';
import { ImageProviderRouter } from './imageProvider';
import { SettingsStore } from '../storage/settingsStore';
import { isSupabaseConfigured } from '../supabase/client';

export class ProviderManager {
  /**
   * Resolves the active AI Strategy & Copy provider.
   * Priority:
   * 1. Supabase Edge Functions (when backend is live)
   * 2. Direct Gemini Provider (when API key is provided)
   * 3. High-Fidelity Mock Provider (instant local zero-key mode)
   */
  public static getAIProvider(): IAIProvider {
    const config = SettingsStore.get();

    if (isSupabaseConfigured()) {
      return new SupabaseFunctionsProvider();
    }

    if (config.geminiApiKey) {
      return new GeminiProvider(config.geminiApiKey, config.defaultModelId);
    }

    return new MockAIProvider();
  }

  /**
   * Resolves the active Image Provider based on configured hierarchy, quality tiers, and spending limits:
   * Free / Dev: NVIDIA NIM / Uploads
   * Paid Standard: FLUX.2 Pro
   * Paid Maximum Quality: FLUX.2 Max
   * Paid Specialized: FLUX.2 Flex
   * Paid Alternate: Gemini Nano Banana Pro
   * Upload-Only Fallback
   */
  public static getImageProvider(): IImageProvider {
    const config = SettingsStore.get();
    return ImageProviderRouter.getAdapterForConfig(config);
  }
}
