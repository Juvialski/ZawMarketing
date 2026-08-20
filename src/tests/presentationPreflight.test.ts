import { describe, it, expect } from 'vitest';
import { SAMPLE_CAMPAIGNS } from '../data/sampleCampaigns';
import { generateDeterministicPresentationDeck } from '../features/presentations/services/demoDeckGenerator';
import { validatePresentationDeck } from '../features/presentations/utils/validatePresentationDeck';
import { DEFAULT_BRAND_KIT } from '../types/brandKit';

describe('presentationPreflight (Automated Preflight QA Checks)', () => {
  const phoenixCampaign = SAMPLE_CAMPAIGNS.find((c) => c.id === 'campaign-phoenix-fix-flip')!;

  it('passes all preflight checks on canonical deterministic demo decks', () => {
    const deck = generateDeterministicPresentationDeck(phoenixCampaign, DEFAULT_BRAND_KIT);
    const report = validatePresentationDeck(deck);

    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(report.checks.length).toBeGreaterThan(0);
    expect(report.checks.every((c) => c.passed)).toBe(true);
  });

  it('fails preflight checks when a deck has no slides or empty titles', () => {
    const deck = generateDeterministicPresentationDeck(phoenixCampaign, DEFAULT_BRAND_KIT);
    deck.slides = [];

    const report = validatePresentationDeck(deck);
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.includes('slide'))).toBe(true);
  });
});
