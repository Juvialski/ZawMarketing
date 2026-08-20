import { ProviderConfig } from '../../types/providers';
import { ModelRegistry } from '../providers/modelRegistry';

const SETTINGS_STORAGE_KEY = 'zaw_marketing_provider_settings_v2';
let inMemorySettingsStorage: string | null = null;

export class SettingsStore {
  private static getStorageItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch {
      // Ignore
    }
    return inMemorySettingsStorage;
  }

  private static setStorageItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Ignore
    }
    inMemorySettingsStorage = value;
  }

  public static get(): ProviderConfig {
    const env = (import.meta as any).env || {};
    const envGeminiKey = env.VITE_GEMINI_API_KEY || '';
    const envNvidiaKey = env.VITE_NVIDIA_API_KEY || '';
    const envBflKey = env.VITE_BFL_API_KEY || '';
    const envOpenAiKey = env.VITE_OPENAI_API_KEY || '';

    const defaultConfig: ProviderConfig = {
      aiProvider: envGeminiKey ? 'gemini' : 'mock',
      geminiApiKey: envGeminiKey,
      defaultModelId: env.VITE_GEMINI_MODEL || ModelRegistry.DEFAULT_TEXT_MODEL, // gemini-3.5-flash-lite
      geminiModel: env.VITE_GEMINI_MODEL || ModelRegistry.DEFAULT_TEXT_MODEL,
      fallbackModelId: ModelRegistry.FALLBACK_TEXT_MODEL, // gemini-3.1-flash-lite
      premiumModelId: ModelRegistry.PREFERRED_PREMIUM_MODEL, // gemini-3.7-flash
      operationOverrides: {},
      thinkingLevels: {
        campaign_kit: 'low',
        campaign_strategy: 'medium',
        final_review: 'high',
        platform_variants: 'low',
      },

      // Image Provider & Quality Tiers
      imageProvider: envBflKey ? 'bfl' : (envNvidiaKey ? 'nvidia' : 'upload'),
      imageQualityTier: 'free_dev',
      geminiImageModel: 'nano-banana-pro',
      geminiImageQuotaAvailable: false, // 0 free quota in project dashboard
      nvidiaApiKey: envNvidiaKey,
      nvidiaBaseUrl: env.VITE_NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
      nvidiaModelId: env.VITE_NVIDIA_MODEL || ModelRegistry.DEFAULT_NVIDIA_MODEL,
      bflApiKey: envBflKey,
      bflBaseUrl: env.VITE_BFL_BASE_URL || 'https://api.bfl.ml/v1',
      bflModelId: 'flux-2-pro',
      openaiApiKey: envOpenAiKey,
      openaiBaseUrl: 'https://api.openai.com/v1',
      openaiImageModel: 'gpt-image-2',

      // Spending Limits (Cost Safety by default)
      imageSpendingLimits: {
        enablePaidGeneration: false, // Default false to prevent unexpected spend
        preferredPaidProvider: 'bfl',
        preferredPaidModel: 'flux-2-max',
        maxImagesPerCampaign: 5,
        dailySpendingLimitUsd: 5.0,
        monthlySpendingLimitUsd: 50.0,
      },

      useMockFallback: true,
      customQuotas: {
        'gemini-3.5-flash-lite': { rpm: 15, tpm: 250000, rpd: 500 },
        'gemini-3.1-flash-lite': { rpm: 15, tpm: 250000, rpd: 500 },
        'gemini-3.5-flash': { rpm: 5, tpm: 250000, rpd: 20 },
        'gemini-3.6-flash': { rpm: 5, tpm: 250000, rpd: 20 },
        'gemini-3.7-flash': { rpm: 5, tpm: 250000, rpd: 20 },
      },
    };

    try {
      const stored = this.getStorageItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...defaultConfig,
          ...parsed,
          imageSpendingLimits: {
            ...defaultConfig.imageSpendingLimits,
            ...(parsed.imageSpendingLimits || {}),
          },
          defaultModelId: parsed.defaultModelId || parsed.geminiModel || defaultConfig.defaultModelId,
          geminiModel: parsed.defaultModelId || parsed.geminiModel || defaultConfig.defaultModelId,
        };
      }
    } catch (e) {
      console.warn('Failed to parse stored settings, using default', e);
    }

    return defaultConfig;
  }

  public static save(config: ProviderConfig): ProviderConfig {
    try {
      const normalized: ProviderConfig = {
        ...config,
        geminiModel: config.defaultModelId,
      };
      this.setStorageItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
    return config;
  }
}
