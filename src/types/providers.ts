/**
 * AI and Image Provider Interface Definitions
 */

import { CampaignSourceData, CampaignStrategy, CampaignCopy, CopyQualityReport } from './campaign';
import { BrandKit } from './brandKit';

export type AIProviderType = 'gemini' | 'mock' | 'auto';
export type ImageProviderType = 'upload' | 'gemini' | 'nvidia' | 'mock';

export interface ProviderConfig {
  aiProvider: AIProviderType;
  geminiApiKey?: string;
  geminiModel: string;
  imageProvider: ImageProviderType;
  geminiImageModel: string;
  nvidiaApiKey?: string;
  nvidiaBaseUrl?: string;
  useMockFallback: boolean;
}

export interface GenerationProgressCallback {
  (step: string, progressPercent: number, details?: string): void;
}

export interface IAIProvider {
  id: string;
  name: string;
  isConfigured(): boolean;
  
  generateStrategy(
    sourceData: CampaignSourceData,
    brandKit: BrandKit,
    onProgress?: GenerationProgressCallback
  ): Promise<CampaignStrategy>;

  generateCopy(
    sourceData: CampaignSourceData,
    strategy: CampaignStrategy,
    brandKit: BrandKit,
    onProgress?: GenerationProgressCallback
  ): Promise<CampaignCopy>;

  reviewCopyQuality(
    copy: CampaignCopy,
    sourceData: CampaignSourceData,
    brandKit: BrandKit
  ): Promise<CopyQualityReport>;
}

export interface GeneratedImageResult {
  url: string;
  id: string;
  altText: string;
  isAiIllustrative: boolean;
  provider: string;
}

export interface IImageProvider {
  id: string;
  name: string;
  isConfigured(): boolean;

  generateConceptImage(
    prompt: string,
    aspectRatio: '1:1' | '4:5' | '16:9' | '9:16',
    contextNotes?: string
  ): Promise<GeneratedImageResult>;
}
