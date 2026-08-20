import { describe, it, expect } from 'vitest';
import { presentationDeckSchema } from '../features/presentations/schemas/presentationSchema';
import { PresentationDeck } from '../types/presentation';
import { DEFAULT_BRAND_KIT } from '../types/brandKit';
import { mapBrandKitToPresentationTheme } from '../features/presentations/themes/presentationTheme';

describe('presentationSchema (Zod Validation & Security)', () => {
  const validTheme = mapBrandKitToPresentationTheme(DEFAULT_BRAND_KIT, 'dark');

  const createValidDeck = (): PresentationDeck => ({
    schemaVersion: '1.0.0',
    id: 'deck-test-1',
    campaignId: 'campaign-test',
    title: 'Acquisition Brief',
    subtitle: 'Value-Add Single Family Flip',
    generatedAt: new Date().toISOString(),
    isDemo: true,
    theme: validTheme,
    slides: [
      {
        id: 'slide-1',
        type: 'cover',
        navLabel: 'Cover',
        kicker: 'Opportunity',
        title: 'Phoenix Value-Add Opportunity',
        subtitle: 'High-Yield Residential Flip',
        foot: 'Confidential Memo',
        speakerNotes: 'Welcome investors.',
      },
      {
        id: 'slide-2',
        type: 'stat_grid',
        navLabel: 'Metrics',
        kicker: 'Financial Snapshot',
        title: 'Core Deal Metrics',
        stats: [
          { label: 'Purchase Basis', value: '$285,000', factKey: 'purchase_price' },
          { label: 'Renovation Budget', value: '$35,000', factKey: 'renovation_estimate' },
        ],
      },
    ],
  });

  it('successfully validates a well-formed presentation deck', () => {
    const deck = createValidDeck();
    const result = presentationDeckSchema.safeParse(deck);
    expect(result.success).toBe(true);
  });

  it('rejects raw HTML/script tags in slide title to prevent XSS', () => {
    const deck = createValidDeck();
    deck.slides[0] = {
      ...deck.slides[0],
      title: 'Malicious <script>alert("xss")</script> Title',
    };
    const result = presentationDeckSchema.safeParse(deck);
    expect(result.success).toBe(false);
  });

  it('rejects decks with duplicate slide IDs', () => {
    const deck = createValidDeck();
    deck.slides[1].id = deck.slides[0].id; // duplicate ID
    const result = presentationDeckSchema.safeParse(deck);
    expect(result.success).toBe(false);
  });

  it('rejects decks with empty slide arrays', () => {
    const deck = createValidDeck();
    deck.slides = [];
    const result = presentationDeckSchema.safeParse(deck);
    expect(result.success).toBe(false);
  });

  it('rejects unrecognized slide types', () => {
    const deck = createValidDeck();
    (deck.slides[0] as unknown as { type: string }).type = 'unknown_invalid_type';
    const result = presentationDeckSchema.safeParse(deck);
    expect(result.success).toBe(false);
  });
});
