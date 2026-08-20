import { ProviderConfig } from '../../types/providers';

const SETTINGS_STORAGE_KEY = 'zaw_marketing_provider_settings_v1';

export class SettingsStore {
  public static get(): ProviderConfig {
    const env = (import.meta as any).env || {};
    const envGeminiKey = env.VITE_GEMINI_API_KEY || '';
    const envNvidiaKey = env.VITE_NVIDIA_API_KEY || '';

    const defaultConfig: ProviderConfig = {
      aiProvider: envGeminiKey ? 'gemini' : 'mock',
      geminiApiKey: envGeminiKey,
      geminiModel: env.VITE_GEMINI_MODEL || 'gemini-3.7-flash',
      imageProvider: envGeminiKey ? 'gemini' : 'upload',
      geminiImageModel: env.VITE_GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image-preview',
      nvidiaApiKey: envNvidiaKey,
      nvidiaBaseUrl: env.VITE_NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
      useMockFallback: true,
    };

    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        return {
          ...defaultConfig,
          ...JSON.parse(stored),
        };
      }
    } catch (e) {
      console.warn('Failed to parse stored settings, using default', e);
    }

    return defaultConfig;
  }

  public static save(config: ProviderConfig): ProviderConfig {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
    return config;
  }
}
