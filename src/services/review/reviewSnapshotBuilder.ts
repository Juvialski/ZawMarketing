/**
 * Review Snapshot Builder
 * Creates clean, client-facing immutable snapshot packages of campaigns for external review.
 * Strips all internal AI metadata, quotas, database IDs, and debug logs.
 */

import { Campaign, OutputAspectRatio, DesignTemplateFamily, GraphicDesignConfig } from '../../types/campaign';
import { BrandKit } from '../../types/brandKit';
import { FORMAT_DIMENSIONS, TEMPLATE_FAMILIES } from '../../types/designs';
import { 
  ReviewSnapshot, 
  SanitizedGraphicMaterial, 
  SanitizedGraphicVariant, 
  SanitizedCopyChannel 
} from '../../types/review';
import { generateDeterministicPresentationDeck } from '../../features/presentations/services/demoDeckGenerator';

export interface SnapshotBuildOptions {
  includedFormats?: OutputAspectRatio[];
  includedVariantsPerFormat?: Record<OutputAspectRatio, DesignTemplateFamily[]>;
  includePresentation?: boolean;
  includeCopy?: boolean;
}

const DEFAULT_FAMILIES: DesignTemplateFamily[] = [
  'editorial',
  'institutional',
  'modern_brokerage',
  'direct_response',
  'market_intelligence',
];

export function buildReviewSnapshot(
  campaign: Campaign,
  brandKit: BrandKit,
  options: SnapshotBuildOptions = {}
): ReviewSnapshot {
  const heroImage =
    campaign.sourceData.uploadedImages.find((img) => img.isHero) ||
    campaign.sourceData.uploadedImages[0] || {
      url: '/demo/fictional-property-exterior.png',
    };

  // 1. Build Graphic Materials with Multi-Variant Options
  const targetFormats: OutputAspectRatio[] = options.includedFormats || [
    'square',
    'portrait',
    'story',
    'landscape',
    'flyer_letter',
  ];

  const graphicMaterials: SanitizedGraphicMaterial[] = targetFormats.map((format) => {
    const dim = FORMAT_DIMENSIONS[format];
    const baseConfig = campaign.designConfigs[format] || {
      templateFamily: 'editorial' as DesignTemplateFamily,
      aspectRatio: format,
      headline: campaign.sourceData.title,
      imageCropY: 50,
      imageZoom: 1.0,
      activeMetricIds: ['purchase', 'arv', 'spread'],
      showDisclaimer: true,
    };

    const variantFamilies = options.includedVariantsPerFormat?.[format] || DEFAULT_FAMILIES;

    const variants: SanitizedGraphicVariant[] = variantFamilies.map((family) => {
      const familyMeta = TEMPLATE_FAMILIES.find((f) => f.id === family);
      const config: GraphicDesignConfig = {
        ...baseConfig,
        templateFamily: family,
        aspectRatio: format,
      };

      return {
        id: family,
        name: familyMeta?.name || family,
        templateFamily: family,
        description: familyMeta?.description || '',
        config,
      };
    });

    let category: 'social' | 'advertising' | 'web' | 'print' = 'social';
    if (format === 'flyer_letter' || format === 'flyer_a4') category = 'print';
    else if (format === 'landscape') category = 'advertising';

    return {
      id: `graphic_${format}`,
      format,
      category,
      label: dim.label,
      sublabel: dim.sublabel,
      dimensions: { width: dim.width, height: dim.height },
      activeVariantId: baseConfig.templateFamily || 'editorial',
      variants,
    };
  });

  // 2. Build Copy Channels
  const copyChannels: SanitizedCopyChannel[] = [];
  if (options.includeCopy !== false && campaign.copy) {
    if (campaign.copy.instagram) {
      copyChannels.push({
        id: 'copy_instagram',
        platform: 'instagram',
        channelName: 'Instagram Caption & Hashtags',
        headline: campaign.copy.instagram.headline || campaign.name,
        body: campaign.copy.instagram.body,
        hook: campaign.copy.instagram.hook,
        cta: campaign.copy.instagram.cta,
        bullets: campaign.copy.instagram.bullets,
        hashtags: campaign.copy.instagram.hashtags,
        characterCount: campaign.copy.instagram.characterCount,
      });
    }

    if (campaign.copy.linkedin) {
      copyChannels.push({
        id: 'copy_linkedin',
        platform: 'linkedin',
        channelName: 'LinkedIn Investment Post',
        headline: campaign.copy.linkedin.headline || campaign.name,
        body: campaign.copy.linkedin.body,
        hook: campaign.copy.linkedin.hook,
        cta: campaign.copy.linkedin.cta,
        bullets: campaign.copy.linkedin.bullets,
        hashtags: campaign.copy.linkedin.hashtags,
        characterCount: campaign.copy.linkedin.characterCount,
      });
    }

    if (campaign.copy.facebook) {
      copyChannels.push({
        id: 'copy_facebook',
        platform: 'facebook',
        channelName: 'Facebook Ad Copy',
        headline: campaign.copy.facebook.headline || campaign.name,
        body: campaign.copy.facebook.body,
        hook: campaign.copy.facebook.hook,
        cta: campaign.copy.facebook.cta,
        bullets: campaign.copy.facebook.bullets,
        hashtags: campaign.copy.facebook.hashtags,
        characterCount: campaign.copy.facebook.characterCount,
      });
    }
  }

  // 3. Presentation Deck
  let presentation = options.includePresentation !== false ? campaign.presentation : undefined;
  if (!presentation && options.includePresentation !== false) {
    presentation = generateDeterministicPresentationDeck(campaign, brandKit);
  }

  // 4. Assemble Sanitized Snapshot (Free of internal AI models / debug data)
  const snapshot: ReviewSnapshot = {
    campaignId: campaign.id,
    campaignTitle: campaign.sourceData.title || campaign.name,
    campaignType: campaign.sourceData.campaignType,
    targetMarket: campaign.sourceData.targetMarket,
    heroImageUrl: heroImage.url,
    property: campaign.sourceData.property
      ? {
          address: campaign.sourceData.property.address,
          city: campaign.sourceData.property.city,
          state: campaign.sourceData.property.state,
          zipCode: campaign.sourceData.property.zipCode,
          neighborhood: campaign.sourceData.property.neighborhood,
          propertyType: campaign.sourceData.property.propertyType,
          bedrooms: campaign.sourceData.property.bedrooms,
          bathrooms: campaign.sourceData.property.bathrooms,
          squareFeet: campaign.sourceData.property.squareFeet,
          yearBuilt: campaign.sourceData.property.yearBuilt,
          financials: {
            purchasePrice: campaign.sourceData.property.financials?.purchasePrice,
            renovationEstimate: campaign.sourceData.property.financials?.renovationEstimate,
            arv: campaign.sourceData.property.financials?.arv,
            projectedProfit: campaign.sourceData.property.financials?.projectedProfit,
            equitySpread: campaign.sourceData.property.financials?.equitySpread,
            roiPercent: campaign.sourceData.property.financials?.roiPercent,
            capRatePercent: campaign.sourceData.property.financials?.capRatePercent,
            cashOnCashPercent: campaign.sourceData.property.financials?.cashOnCashPercent,
          },
          investmentThesis: campaign.sourceData.property.investmentThesis,
          dealHighlights: campaign.sourceData.property.dealHighlights || [],
          renovationScope: campaign.sourceData.property.renovationScope,
        }
      : undefined,
    brandKit: {
      companyName: brandKit.companyName,
      tagline: brandKit.tagline,
      logoUrl: brandKit.logoUrl,
      logoDarkUrl: brandKit.logoDarkUrl,
      website: brandKit.website,
      phone: brandKit.phone,
      email: brandKit.email,
      licenseNumber: brandKit.licenseNumber,
      colors: {
        primary: brandKit.colors.primary,
        secondary: brandKit.colors.secondary,
        accent: brandKit.colors.accent,
        backgroundLight: brandKit.colors.backgroundLight,
        backgroundDark: brandKit.colors.backgroundDark,
        textPrimary: brandKit.colors.textPrimary,
        textMuted: brandKit.colors.textMuted,
      },
      typography: {
        headlineFont: brandKit.typography.headlineFont,
        bodyFont: brandKit.typography.bodyFont,
        monoFont: brandKit.typography.monoFont,
        familyPairing: brandKit.typography.familyPairing,
      },
      disclaimer: brandKit.requiredDisclaimer,
    },
    strategy: campaign.strategy
      ? {
          primaryObjective: campaign.strategy.primaryObjective,
          coreAngle: campaign.strategy.coreAngle,
          keyHooks: campaign.strategy.keyHooks,
          valueProposition: campaign.strategy.valueProposition,
          targetAudience: {
            name: campaign.strategy.targetAudience.name,
            description: campaign.strategy.targetAudience.description,
            painPoints: campaign.strategy.targetAudience.painPoints,
            motivations: campaign.strategy.targetAudience.motivations,
          },
          supportingEvidence: campaign.strategy.supportingEvidence,
        }
      : undefined,
    presentation,
    graphicMaterials,
    copyChannels,
    videoScript: options.includeCopy !== false ? campaign.copy?.videoScript : undefined,
    emailNewsletter: options.includeCopy !== false && campaign.copy?.emailNewsletter
      ? {
          subjectLines: campaign.copy.emailNewsletter.subjectLines,
          previewText: campaign.copy.emailNewsletter.previewText,
          bodyMarkdown: campaign.copy.emailNewsletter.bodyMarkdown,
          ctaButtonText: campaign.copy.emailNewsletter.ctaButtonText,
        }
      : undefined,
  };

  return snapshot;
}
