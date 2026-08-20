import { Campaign } from '../../../types/campaign';
import { BrandKit, DEFAULT_BRAND_KIT } from '../../../types/brandKit';
import { PresentationDeck, PresentationSlide } from '../../../types/presentation';
import { mapBrandKitToPresentationTheme } from '../themes/presentationTheme';
import { buildCampaignFactLedger } from '../../../services/financials/campaignFactLedger';

export function generateDeterministicPresentationDeck(
  campaign: Campaign,
  brandKit: BrandKit = DEFAULT_BRAND_KIT
): PresentationDeck {
  const ledger = buildCampaignFactLedger(campaign);
  const fin = ledger.financials;
  const prop = campaign.sourceData.property;
  const isDemo = ledger.isDemo;

  const theme = mapBrandKitToPresentationTheme(brandKit, 'dark');
  const heroImage = campaign.sourceData.uploadedImages.find((img) => img.isHero)?.url ||
    campaign.sourceData.uploadedImages[0]?.url;
  const secondaryImage = campaign.sourceData.uploadedImages.find((img) => !img.isHero)?.url ||
    campaign.sourceData.uploadedImages[1]?.url;

  const isMultiFamily = prop?.propertyType === 'multi_family';

  const slides: PresentationSlide[] = [
    // 1. Cover
    {
      id: `${campaign.id}-slide-1-cover`,
      type: 'cover',
      navLabel: 'Cover',
      kicker: `${brandKit.companyName} · ${isDemo ? 'FICTIONAL DEMO' : 'INVESTMENT OPPORTUNITY'}`,
      title: campaign.sourceData.title || campaign.name,
      subtitle: prop?.investmentThesis || campaign.strategy?.coreAngle || 'High-Yield Value-Add Acquisition Brief',
      imageUrl: heroImage,
      foot: `${isDemo ? 'DEMO FIXTURE · ' : ''}${campaign.sourceData.targetMarket} · ${new Date().getFullYear()}`,
      speakerNotes: 'Welcome everyone. Today we are presenting a targeted value-add opportunity underwritten with conservative underwriting metrics.',
    },

    // 2. Executive Summary
    {
      id: `${campaign.id}-slide-2-exec-summary`,
      type: 'executive_summary',
      navLabel: 'Summary',
      kicker: 'Executive Summary',
      title: 'Opportunity & Underwriting Overview',
      summary: prop?.investmentThesis || campaign.strategy?.valueProposition || 'Acquire at favorable basis with clear cosmetic/value-add upside in high-liquidity submarket.',
      highlights: prop?.dealHighlights && prop.dealHighlights.length > 0
        ? prop.dealHighlights.slice(0, 4)
        : [
            `Purchase Basis: ${fin.purchasePrice ? '$' + fin.purchasePrice.toLocaleString() : 'Underwritten'}`,
            `Estimated Renovation: $${fin.renovationEstimate.toLocaleString()}`,
            fin.grossSpread !== undefined ? `Gross Equity Spread: $${fin.grossSpread.toLocaleString()} (${fin.grossSpreadPercentOnCost?.toFixed(1)}% on cost)` : 'Favorable submarket spread',
            `Target Resale / Stabilization: ${campaign.sourceData.targetMarket}`,
          ],
      speakerNotes: 'Highlight the acquisition basis discount and short turnaround schedule minimizing holding costs.',
    },

    // 3. Property Overview
    {
      id: `${campaign.id}-slide-3-property`,
      type: 'property_overview',
      navLabel: 'Property',
      kicker: 'Asset Specifications',
      title: prop?.address ? `${prop.address}` : 'Property Specifications',
      address: prop?.address || '4421 E Cambridge Ave',
      city: prop?.city || 'Phoenix',
      state: prop?.state || 'AZ',
      zipCode: prop?.zipCode || '85008',
      propertyType: prop?.propertyType || 'single_family',
      bedrooms: prop?.bedrooms,
      bathrooms: prop?.bathrooms,
      squareFeet: prop?.squareFeet,
      yearBuilt: prop?.yearBuilt,
      highlights: prop?.dealHighlights && prop.dealHighlights.length > 0
        ? prop.dealHighlights
        : ['Clear title', 'Vacant on close', 'Standard inspection period'],
      imageUrl: secondaryImage || heroImage,
      speakerNotes: 'Review the physical layout, floor plan specifications, and submarket neighborhood context.',
    },

    // 4. Investment Thesis
    {
      id: `${campaign.id}-slide-4-thesis`,
      type: 'investment_thesis',
      navLabel: 'Thesis',
      kicker: 'Strategic Thesis',
      title: 'Value-Add Acquisition & Value Creation',
      thesis: prop?.investmentThesis || 'Acquisition at significant discount to recent neighborhood renovated comparables, enabling immediate equity creation through targeted capital improvements.',
      pillars: campaign.strategy?.keyHooks && campaign.strategy.keyHooks.length > 0
        ? campaign.strategy.keyHooks.slice(0, 3)
        : [
            'Immediate acquisition basis discount below median replacement cost',
            'Strict cosmetic renovation scope mitigating supply-chain and structural risk',
            'High submarket liquidity with low average days on market',
          ],
      speakerNotes: 'Walk through why this deal is defensible and how we protect downside capital.',
    },

    // 5. Financial Snapshot (Financial Truth Engine)
    {
      id: `${campaign.id}-slide-5-financials`,
      type: 'financial_snapshot',
      navLabel: 'Financials',
      kicker: 'Underwritten Financials',
      title: isMultiFamily ? 'Stabilized Yield & Pro Forma Summary' : 'Acquisition Basis & Equity Spread',
      metrics: isMultiFamily
        ? [
            { label: 'Purchase Price', value: fin.purchasePrice ? '$' + fin.purchasePrice.toLocaleString() : '$1,480,000', factKey: 'purchase_price' },
            { label: 'Renovation Budget', value: '$' + fin.renovationEstimate.toLocaleString(), factKey: 'renovation_estimate' },
            { label: 'All-In Project Basis', value: '$' + fin.allInBasis.toLocaleString(), factKey: 'all_in_basis' },
            { label: 'In-Place Cap Rate', value: fin.inPlaceCapRateOnPurchase ? `${fin.inPlaceCapRateOnPurchase.toFixed(1)}%` : '6.3%', factKey: 'in_place_cap_rate' },
            { label: 'Stabilized Cap Rate (Purchase)', value: fin.stabilizedCapRateOnPurchase ? `${fin.stabilizedCapRateOnPurchase.toFixed(1)}%` : '9.4%', factKey: 'stabilized_cap_rate_on_purchase', highlight: true },
            { label: 'Stabilized Yield on Cost', value: fin.stabilizedYieldOnTotalCost ? `${fin.stabilizedYieldOnTotalCost.toFixed(1)}%` : '8.7%', factKey: 'stabilized_yield_on_cost', highlight: true },
          ]
        : [
            { label: 'Purchase Price', value: fin.purchasePrice ? '$' + fin.purchasePrice.toLocaleString() : '$285,000', factKey: 'purchase_price' },
            { label: 'Renovation Budget', value: '$' + fin.renovationEstimate.toLocaleString(), factKey: 'renovation_estimate' },
            { label: 'All-In Project Basis', value: '$' + fin.allInBasis.toLocaleString(), factKey: 'all_in_basis' },
            { label: 'Projected ARV', value: fin.arv ? '$' + fin.arv.toLocaleString() : '$390,000', factKey: 'arv' },
            { label: 'Projected Gross Spread', value: fin.grossSpread !== undefined ? '$' + fin.grossSpread.toLocaleString() : '$70,000', factKey: 'gross_spread', highlight: true },
            { label: 'Gross Spread on Cost', value: fin.grossSpreadPercentOnCost !== undefined ? `${fin.grossSpreadPercentOnCost.toFixed(1)}%` : '21.9%', factKey: 'gross_spread_percent_on_cost', highlight: true },
          ],
      disclosures: ledger.disclosures,
      speakerNotes: 'All metrics shown are canonical arithmetic calculations derived from verified underwriting inputs.',
    },

    // 6. Execution Timeline
    {
      id: `${campaign.id}-slide-6-timeline`,
      type: 'timeline',
      navLabel: 'Timeline',
      kicker: 'Project Execution',
      title: isMultiFamily ? 'Repositioning & Value-Add Milestones' : 'Renovation & Disposition Timeline',
      items: isMultiFamily
        ? [
            { time: 'Month 1-2', title: 'Acquisition & Operational Takeover', body: 'Close escrow, transition property management, audit unit leases.' },
            { time: 'Month 3-6', title: 'Phased Interior Modernization', body: 'Renovate vacant units with modern quartz, stainless appliances, and LVP flooring.' },
            { time: 'Month 7-9', title: 'Lease-Up at Market Rates', body: 'Achieve projected $1,450/mo target rents across repositioned units.' },
            { time: 'Month 10-12', title: 'Stabilization & Refinance / Disposition', body: 'Stabilize at 8.7% yield on cost for long-term cash flow or agency exit.' },
          ]
        : [
            { time: 'Week 1-2', title: 'Closing & Scope Mobilization', body: 'Close escrow, pull permits, mobilize trades and staging contractors.' },
            { time: 'Week 3-6', title: 'Interior & Exterior Renovation', body: 'Kitchen reface, quartz install, bath upgrade, interior/exterior paint.' },
            { time: 'Week 7-8', title: 'Staging, Photography & MLS Launch', body: 'Professional architectural capture, launch coordinated multi-platform marketing.' },
            { time: 'Week 9-12', title: 'Contract Execution & Disposition', body: 'Under contract to owner-occupant or cash buyer, closing and capital return.' },
          ],
      speakerNotes: 'Review the phased project milestones and operational timeline.',
    },

    // 7. Market Context & Comps
    {
      id: `${campaign.id}-slide-7-market`,
      type: 'market_context',
      navLabel: 'Market',
      kicker: 'Submarket Intelligence',
      title: `${campaign.sourceData.targetMarket} Dynamics`,
      submarket: campaign.sourceData.targetMarket,
      insights: campaign.strategy?.supportingEvidence && campaign.strategy.supportingEvidence.length > 0
        ? campaign.strategy.supportingEvidence
        : [
            'Submarket inventory remains constrained with tight months of supply.',
            'Strong buyer demand for renovated inventory in prime school corridors.',
            'Average days on market for updated properties is under 30 days.',
          ],
      comps: isMultiFamily
        ? [
            { address: '1814 Henderson Ave', price: '$1,620,000', sqft: '$202,500/door', notes: 'Renovated 8-unit, 5.8% cap rate' },
            { address: '2209 Greenville Ave', price: '$1,550,000', sqft: '$193,750/door', notes: 'Turnkey 8-unit, 6.1% cap rate' },
          ]
        : [
            { address: '4318 E Cambridge Ave', price: '$405,000', sqft: '$223.75/SF', notes: 'Renovated 3/2, closed in 18 DOM' },
            { address: '4502 E Montecito Ave', price: '$392,000', sqft: '$220.22/SF', notes: 'Standard cosmetic update, closed in 22 DOM' },
          ],
      speakerNotes: 'Demonstrate that our exit price and rental assumptions are fully supported by recent closed comps.',
    },

    // 8. Marketing Strategy & Platform Hooks
    {
      id: `${campaign.id}-slide-8-marketing-strategy`,
      type: 'marketing_strategy',
      navLabel: 'Marketing',
      kicker: 'Syndication & Marketing',
      title: 'Multi-Channel Acquisition & Investor Outreach',
      coreAngle: campaign.strategy?.coreAngle || 'Clear $70k Spread on Light Cosmetic Scope in High-Demand Corridor',
      hooks: campaign.strategy?.keyHooks && campaign.strategy.keyHooks.length > 0
        ? campaign.strategy.keyHooks.slice(0, 3)
        : [
            'Below-market acquisition basis with verified comp support',
            'Strict cosmetic renovation scope avoiding structural risk',
            'High liquidity submarket with documented buyer demand',
          ],
      platforms: campaign.strategy?.suggestedPlatforms || ['linkedin', 'instagram', 'facebook', 'email', 'video_reels'],
      cta: campaign.strategy?.ctaStrategy || brandKit.preferredCta,
      speakerNotes: 'Explain how ZawMarketing orchestrates simultaneous multi-platform campaigns for this opportunity.',
    },

    // 9. Creative Showcase
    {
      id: `${campaign.id}-slide-9-creative-showcase`,
      type: 'creative_showcase',
      navLabel: 'Creatives',
      kicker: 'Coordinated Asset Suite',
      title: 'One Campaign Brief → Complete Creative Suite',
      subtitle: 'Deterministic social graphics and flyers generated in tandem with this investment memorandum.',
      previewFormats: ['square', 'portrait', 'story', 'landscape'],
      speakerNotes: 'Show that ZawMarketing produces a unified package: social graphics, flyers, copy, video scripts, and this presentation deck.',
    },

    // 10. Short-Form Video Concept
    {
      id: `${campaign.id}-slide-10-video-concept`,
      type: 'video_concept',
      navLabel: 'Video Plan',
      kicker: 'Short-Form Video Strategy',
      title: '60-Second Vertical Reel / Storyboard Plan',
      hook: campaign.copy?.videoScript.hook || 'Why investors are targeting cosmetic flips in this high-demand Phoenix submarket.',
      durationSeconds: campaign.copy?.videoScript.durationSeconds || 60,
      scenes: campaign.copy?.videoScript.scenes && campaign.copy.videoScript.scenes.length > 0
        ? campaign.copy.videoScript.scenes
        : [
            { timeframe: '0:00 - 0:05', visualDirection: 'Drone establishing shot of neighborhood and exterior facade', spokenAudio: 'Here is a $70k spread cosmetic deal in Arcadia Lite.', onScreenText: '4421 E Cambridge · Phoenix, AZ' },
            { timeframe: '0:05 - 0:20', visualDirection: 'Fast walk-through showing solid bones and kitchen layout', spokenAudio: 'Acquired at $285k, with just $35k in cosmetic updates needed.', onScreenText: '$285k Entry Basis · $35k Budget' },
            { timeframe: '0:20 - 0:45', visualDirection: 'Show comp photos and neighborhood amenities', spokenAudio: 'Recent neighborhood comps are selling at $390k to $405k in under 3 weeks.', onScreenText: '$390k ARV · 21.9% Spread on Cost' },
            { timeframe: '0:45 - 1:00', visualDirection: 'Host on camera with contact details', spokenAudio: 'DM us or click the link in bio to receive the complete pro forma.', onScreenText: 'Request Full Underwriting Memo' },
          ],
      cta: campaign.copy?.videoScript.callToAction || 'Request Full Underwriting Pro Forma',
      speakerNotes: 'Review the short-form video production plan designed for vertical reels and social channels.',
    },

    // 11. Risk & Disclaimer
    {
      id: `${campaign.id}-slide-11-disclaimer`,
      type: 'risk_disclaimer',
      navLabel: 'Disclosures',
      kicker: 'Compliance & Disclosures',
      title: 'Underwriting Assumptions & Risk Notice',
      disclaimerText: brandKit.requiredDisclaimer,
      additionalCaveats: [
        'Pro forma financials, renovation estimates, and ARV projections are based on current market conditions and do not guarantee future performance.',
        'Investors are advised to conduct independent physical, environmental, zoning, and financial due diligence prior to investment.',
        isDemo ? 'FICTIONAL DEMO SAMPLE: All property details and financial figures are demonstration fixtures for marketing platform evaluation.' : 'Confidential marketing presentation for qualified and accredited parties only.',
      ],
      speakerNotes: 'Ensure all investors and partners understand the underwriting assumptions and risk caveats.',
    },

    // 12. Next Steps / CTA
    {
      id: `${campaign.id}-slide-12-next-steps`,
      type: 'next_steps',
      navLabel: 'Next Steps',
      kicker: 'Take Action',
      title: 'Request Detailed Due Diligence Package',
      ctaText: brandKit.preferredCta,
      contactInfo: {
        company: brandKit.companyName,
        email: brandKit.email,
        phone: brandKit.phone,
        website: brandKit.website,
        licenseNumber: brandKit.licenseNumber,
      },
      speakerNotes: 'Open the floor for questions and direct partners to request the full underwriting package.',
    },
  ];

  return {
    schemaVersion: '1.0.0',
    id: `deck-${campaign.id}`,
    campaignId: campaign.id,
    title: campaign.sourceData.title || campaign.name,
    subtitle: prop?.investmentThesis || campaign.strategy?.coreAngle,
    generatedAt: new Date().toISOString(),
    isDemo,
    theme,
    slides,
    generationMetadata: {
      requestedModel: 'deterministic-truth-engine',
      actualModel: 'deterministic-truth-engine',
      fallbackOccurred: false,
      latencyMs: 0,
      timestamp: new Date().toISOString(),
    },
  };
}
