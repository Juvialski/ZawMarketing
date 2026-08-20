import React from 'react';
import { Campaign, GraphicDesignConfig, OutputAspectRatio } from '../../types/campaign';
import { BrandKit } from '../../types/brandKit';
import { FORMAT_DIMENSIONS } from '../../types/designs';
import { EditorialTemplate } from './templates/EditorialTemplate';
import { InstitutionalTemplate } from './templates/InstitutionalTemplate';
import { ModernBrokerageTemplate } from './templates/ModernBrokerageTemplate';
import { DirectResponseTemplate } from './templates/DirectResponseTemplate';
import { MarketIntelligenceTemplate } from './templates/MarketIntelligenceTemplate';
import { FlyerTemplate } from './templates/FlyerTemplate';

interface DesignRendererProps {
  campaign: Campaign;
  aspectRatio: OutputAspectRatio;
  configOverride?: Partial<GraphicDesignConfig>;
  brandKit: BrandKit;
  className?: string;
  id?: string;
}

export const DesignRenderer: React.FC<DesignRendererProps> = ({
  campaign,
  aspectRatio,
  configOverride,
  brandKit,
  className = '',
  id,
}) => {
  const baseConfig = campaign.designConfigs[aspectRatio] || {
    templateFamily: 'editorial',
    aspectRatio,
    headline: campaign.sourceData.title,
    imageCropY: 50,
    imageZoom: 1.0,
    activeMetricIds: ['purchase', 'arv', 'spread'],
    showDisclaimer: true,
  };

  const config: GraphicDesignConfig = {
    ...baseConfig,
    ...configOverride,
    aspectRatio,
  };

  // Determine active hero image
  const heroImage =
    campaign.sourceData.uploadedImages.find((img) => img.id === config.imageId) ||
    campaign.sourceData.uploadedImages.find((img) => img.isHero) ||
    campaign.sourceData.uploadedImages[0] || {
      url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1600&q=80',
    };

  const dimensions = FORMAT_DIMENSIONS[aspectRatio];

  // Aspect ratio class mapping
  const aspectClassMap: Record<OutputAspectRatio, string> = {
    square: 'canvas-aspect-square',
    portrait: 'canvas-aspect-portrait',
    story: 'canvas-aspect-story',
    landscape: 'canvas-aspect-landscape',
    flyer_letter: 'canvas-aspect-flyer-letter',
    flyer_a4: 'canvas-aspect-flyer-a4',
  };

  const renderTemplateContent = () => {
    if (aspectRatio === 'flyer_letter' || aspectRatio === 'flyer_a4') {
      return (
        <FlyerTemplate
          campaign={campaign}
          config={config}
          brandKit={brandKit}
          heroImageUrl={heroImage.url}
        />
      );
    }

    switch (config.templateFamily) {
      case 'institutional':
        return (
          <InstitutionalTemplate
            campaign={campaign}
            config={config}
            brandKit={brandKit}
            heroImageUrl={heroImage.url}
          />
        );
      case 'modern_brokerage':
        return (
          <ModernBrokerageTemplate
            campaign={campaign}
            config={config}
            brandKit={brandKit}
            heroImageUrl={heroImage.url}
          />
        );
      case 'direct_response':
        return (
          <DirectResponseTemplate
            campaign={campaign}
            config={config}
            brandKit={brandKit}
            heroImageUrl={heroImage.url}
          />
        );
      case 'market_intelligence':
        return (
          <MarketIntelligenceTemplate
            campaign={campaign}
            config={config}
            brandKit={brandKit}
            heroImageUrl={heroImage.url}
          />
        );
      case 'editorial':
      default:
        return (
          <EditorialTemplate
            campaign={campaign}
            config={config}
            brandKit={brandKit}
            heroImageUrl={heroImage.url}
          />
        );
    }
  };

  return (
    <div
      id={id}
      className={`relative w-full ${aspectClassMap[aspectRatio]} overflow-hidden shadow-md bg-white ${className}`}
      data-aspect-ratio={aspectRatio}
      data-target-width={dimensions.width}
      data-target-height={dimensions.height}
    >
      {renderTemplateContent()}
    </div>
  );
};
