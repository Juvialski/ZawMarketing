import { Campaign, GraphicDesignConfig, OutputAspectRatio } from '../../types/campaign';
import { SAMPLE_CAMPAIGNS } from '../../data/sampleCampaigns';

const STORAGE_KEY = 'zaw_marketing_campaigns_v1';

export class CampaignStore {
  private static getInitialCampaigns(): Campaign[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load campaigns from localStorage, using samples', e);
    }
    // Initialize with sample campaigns
    this.saveToStorage(SAMPLE_CAMPAIGNS);
    return SAMPLE_CAMPAIGNS;
  }

  private static saveToStorage(campaigns: Campaign[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
    } catch (e) {
      console.error('Failed to save campaigns to localStorage', e);
    }
  }

  public static getAll(): Campaign[] {
    return this.getInitialCampaigns();
  }

  public static getById(id: string): Campaign | undefined {
    const campaigns = this.getAll();
    return campaigns.find((c) => c.id === id);
  }

  public static save(campaign: Campaign): Campaign {
    const campaigns = this.getAll();
    const index = campaigns.findIndex((c) => c.id === campaign.id);
    const updated = {
      ...campaign,
      updatedAt: new Date().toISOString(),
    };

    if (index >= 0) {
      campaigns[index] = updated;
    } else {
      campaigns.unshift(updated);
    }

    this.saveToStorage(campaigns);
    return updated;
  }

  public static duplicate(id: string): Campaign | null {
    const campaign = this.getById(id);
    if (!campaign) return null;

    const newId = `campaign-${Date.now()}`;
    const duplicated: Campaign = {
      ...JSON.parse(JSON.stringify(campaign)),
      id: newId,
      name: `${campaign.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.save(duplicated);
    return duplicated;
  }

  public static delete(id: string): boolean {
    const campaigns = this.getAll();
    const filtered = campaigns.filter((c) => c.id !== id);
    if (filtered.length !== campaigns.length) {
      this.saveToStorage(filtered);
      return true;
    }
    return false;
  }

  public static resetToSamples(): Campaign[] {
    this.saveToStorage(SAMPLE_CAMPAIGNS);
    return SAMPLE_CAMPAIGNS;
  }

  public static createDefaultDesignConfigs(): Record<OutputAspectRatio, GraphicDesignConfig> {
    return {
      square: {
        templateFamily: 'editorial',
        aspectRatio: 'square',
        headline: 'Value-Add Real Estate Opportunity',
        subtitle: 'Prime Metropolitan Location',
        imageCropY: 50,
        imageZoom: 1.0,
        activeMetricIds: ['purchase', 'arv', 'spread'],
        customBadgeText: 'FEATURED OPPORTUNITY',
        customCtaText: 'REQUEST DETAILS',
        showDisclaimer: true,
      },
      portrait: {
        templateFamily: 'institutional',
        aspectRatio: 'portrait',
        headline: 'Investment Memorandum',
        subtitle: 'Value-Add Real Estate Acquisition',
        imageCropY: 50,
        imageZoom: 1.0,
        activeMetricIds: ['purchase', 'reno', 'arv', 'spread'],
        customBadgeText: 'CONFIDENTIAL',
        customCtaText: 'DOWNLOAD MEMORANDUM',
        showDisclaimer: true,
      },
      story: {
        templateFamily: 'direct_response',
        aspectRatio: 'story',
        headline: 'New Value-Add Opportunity',
        subtitle: 'Direct Underwriting Breakdown',
        imageCropY: 40,
        imageZoom: 1.05,
        activeMetricIds: ['purchase', 'arv'],
        customBadgeText: 'DEAL BRIEF',
        customCtaText: 'TAP FOR DETAILS',
        showDisclaimer: false,
      },
      landscape: {
        templateFamily: 'modern_brokerage',
        aspectRatio: 'landscape',
        headline: 'Acquisition Brief',
        subtitle: 'Institutional Quality Value-Add Property',
        imageCropY: 50,
        imageZoom: 1.0,
        activeMetricIds: ['purchase', 'arv', 'spread'],
        customBadgeText: 'MARKET BRIEF',
        customCtaText: 'VIEW DEAL ROOM',
        showDisclaimer: true,
      },
      flyer_letter: {
        templateFamily: 'institutional',
        aspectRatio: 'flyer_letter',
        headline: 'Property Investment Memorandum',
        subtitle: 'Underwriting Analysis & Deal Highlights',
        imageCropY: 50,
        imageZoom: 1.0,
        activeMetricIds: ['purchase', 'reno', 'arv', 'spread', 'sqft', 'roi'],
        customBadgeText: 'INVESTMENT BRIEF',
        customCtaText: 'CONTACT ACQUISITIONS',
        showDisclaimer: true,
      },
      flyer_a4: {
        templateFamily: 'institutional',
        aspectRatio: 'flyer_a4',
        headline: 'Property Investment Memorandum',
        subtitle: 'Underwriting Analysis & Deal Highlights',
        imageCropY: 50,
        imageZoom: 1.0,
        activeMetricIds: ['purchase', 'reno', 'arv', 'spread', 'sqft', 'roi'],
        customBadgeText: 'INVESTMENT BRIEF',
        customCtaText: 'CONTACT ACQUISITIONS',
        showDisclaimer: true,
      },
    };
  }
}
