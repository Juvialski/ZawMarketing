import { IAIProvider, IImageProvider } from '../../types/providers';
import { SettingsStore } from '../storage/settingsStore';
import { GeminiProvider } from './geminiProvider';
import { MockAIProvider } from './mockProvider';
import { UploadOnlyProvider, GeminiImageProvider } from './imageProvider';

export class ProviderManager {
  public static getAIProvider(): IAIProvider {
    const config = SettingsStore.get();

    if (config.aiProvider === 'gemini' && config.geminiApiKey) {
      return new GeminiProvider(config.geminiApiKey, config.geminiModel);
    }

    if (config.aiProvider === 'auto') {
      if (config.geminiApiKey) {
        return new GeminiProvider(config.geminiApiKey, config.geminiModel);
      }
    }

    // Default to Mock provider for zero-config local runs
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
