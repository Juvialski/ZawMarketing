import { IAIProvider, IImageProvider } from '../../types/providers';
import { GeminiProvider } from './geminiProvider';
import { MockAIProvider } from './mockProvider';
import { SupabaseFunctionsProvider } from './supabaseFunctionsProvider';
import { UploadOnlyProvider, GeminiImageProvider } from './imageProvider';
import { SettingsStore } from '../storage/settingsStore';
import { isSupabaseConfigured } from '../supabase/client';

export class ProviderManager {
  public static getAIProvider(): IAIProvider {
    const config = SettingsStore.get();

    // If Supabase is configured and live, prefer server-side edge function provider
    if (isSupabaseConfigured()) {
      return new SupabaseFunctionsProvider();
    }

    if (config.geminiApiKey) {
      return new GeminiProvider(config.geminiApiKey, config.geminiModel);
    }

    return new MockAIProvider();
  }

  public static getImageProvider(): IImageProvider {
    const config = SettingsStore.get();

    if (config.imageProvider === 'gemini' && config.geminiApiKey) {
      return new GeminiImageProvider(config.geminiApiKey, config.geminiImageModel);
    }

    return new UploadOnlyProvider();
  }
}
