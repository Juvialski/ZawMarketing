import { BrandKit, DEFAULT_BRAND_KIT } from '../../types/brandKit';

const BRAND_STORAGE_KEY = 'zaw_marketing_brand_kit_v1';

export class BrandKitStore {
  public static get(): BrandKit {
    try {
      const stored = localStorage.getItem(BRAND_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load brand kit, using default', e);
    }
    this.save(DEFAULT_BRAND_KIT);
    return DEFAULT_BRAND_KIT;
  }

  public static save(brandKit: BrandKit): BrandKit {
    try {
      localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(brandKit));
    } catch (e) {
      console.error('Failed to save brand kit', e);
    }
    return brandKit;
  }

  public static resetToDefault(): BrandKit {
    this.save(DEFAULT_BRAND_KIT);
    return DEFAULT_BRAND_KIT;
  }
}
