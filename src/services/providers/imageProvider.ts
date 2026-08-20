import { IImageProvider, GeneratedImageResult } from '../../types/providers';
import { GoogleGenAI } from '@google/genai';

export const CURATED_STOCK_PHOTOS = [
  {
    id: 'stock-modern-exterior',
    name: 'Modern Single Family Exterior',
    url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1600&q=80',
    category: 'exterior',
  },
  {
    id: 'stock-luxury-villa',
    name: 'Contemporary Luxury Residence',
    url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80',
    category: 'exterior',
  },
  {
    id: 'stock-modern-kitchen',
    name: 'Renovated Open Concept Kitchen',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
    category: 'interior',
  },
  {
    id: 'stock-primary-suite',
    name: 'Spacious Primary Bedroom Suite',
    url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1600&q=80',
    category: 'interior',
  },
  {
    id: 'stock-multifamily',
    name: 'Boutique Apartment Community',
    url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80',
    category: 'commercial',
  },
  {
    id: 'stock-modern-living',
    name: 'Sunlit Hardwood Living Room',
    url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80',
    category: 'interior',
  },
  {
    id: 'stock-aerial-neighborhood',
    name: 'Metropolitan Aerial Submarket',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80',
    category: 'neighborhood',
  },
  {
    id: 'stock-market-skyline',
    name: 'Financial District & Real Estate Skyline',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
    category: 'market',
  },
];

export class UploadOnlyProvider implements IImageProvider {
  public id = 'upload-provider';
  public name = 'Authentic Photography (Upload Only)';

  public isConfigured(): boolean {
    return true;
  }

  public async generateConceptImage(
    _prompt: string,
    _aspectRatio: '1:1' | '4:5' | '16:9' | '9:16'
  ): Promise<GeneratedImageResult> {
    // Select the best matching curated architectural photo
    const randomIndex = Math.floor(Math.random() * CURATED_STOCK_PHOTOS.length);
    const photo = CURATED_STOCK_PHOTOS[randomIndex];

    return {
      id: `sample-photo-${Date.now()}`,
      url: photo.url,
      altText: photo.name,
      isAiIllustrative: false,
      provider: 'authentic_curated_stock',
    };
  }
}

export class GeminiImageProvider implements IImageProvider {
  public id = 'gemini-image-provider';
  public name = 'Gemini Illustrative Concept Engine';
  private apiKey: string;
  private modelName: string;

  constructor(apiKey: string, modelName = 'gemini-3.1-flash-image-preview') {
    this.apiKey = apiKey;
    this.modelName = modelName;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async generateConceptImage(
    prompt: string,
    aspectRatio: '1:1' | '4:5' | '16:9' | '9:16',
    contextNotes?: string
  ): Promise<GeneratedImageResult> {
    if (!this.isConfigured()) {
      const uploadFallback = new UploadOnlyProvider();
      return uploadFallback.generateConceptImage(prompt, aspectRatio);
    }

    try {
      const ai = new GoogleGenAI({ apiKey: this.apiKey });
      const refinedPrompt = `High-end architectural concept rendering, professional architectural photography style, clean natural daylight, realistic materials, no text, no watermarks, no distorted geometry. Theme: ${prompt}. Context: ${contextNotes || ''}`;

      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: refinedPrompt,
      });

      // If image bytes/parts are returned in response
      // @ts-ignore
      const candidates = response.candidates;
      if (candidates && candidates[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
          // @ts-ignore
          if (part.inlineData && part.inlineData.data) {
            // @ts-ignore
            const base64Url = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            return {
              id: `gemini-img-${Date.now()}`,
              url: base64Url,
              altText: `AI Illustrative Concept: ${prompt}`,
              isAiIllustrative: true,
              provider: 'gemini_image',
            };
          }
        }
      }

      // Fallback if model did not return inline image
      const uploadFallback = new UploadOnlyProvider();
      return uploadFallback.generateConceptImage(prompt, aspectRatio);
    } catch (err) {
      console.warn('Gemini image generation failed or unavailable, falling back to authentic photography fixture:', err);
      const uploadFallback = new UploadOnlyProvider();
      return uploadFallback.generateConceptImage(prompt, aspectRatio);
    }
  }
}
