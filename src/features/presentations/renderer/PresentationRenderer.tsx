import React from 'react';
import { PresentationDeck } from '../../../types/presentation';
import { Campaign } from '../../../types/campaign';
import { BrandKit } from '../../../types/brandKit';
import { themeToCssVariables } from '../themes/presentationTheme';
import Deck from '../bolt/Deck';
import { SemanticSlideRenderer } from './SemanticSlideRenderer';
import { FictionalDemoBanner } from './FictionalDemoBanner';
import '../styles/presentation.css';

export interface PresentationRendererProps {
  deck: PresentationDeck;
  campaign?: Campaign;
  brandKit?: BrandKit;
  className?: string;
  style?: React.CSSProperties;
  onNotesChange?: (slideIndex: number, notes: string) => void;
  readOnly?: boolean;
}

export const PresentationRenderer: React.FC<PresentationRendererProps> = ({
  deck,
  campaign,
  brandKit,
  className = '',
  style = {},
  onNotesChange,
  readOnly = false,
}) => {
  const themeStyles = themeToCssVariables(deck.theme);
  const isDemo = deck.isDemo ?? (campaign?.tags?.includes('Demo') || campaign?.id.includes('demo') || campaign?.id.includes('sample'));

  const visibleSlides = deck.slides.filter((s) => !s.isHidden);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', ...style }}>
      {isDemo && <FictionalDemoBanner />}
      <Deck
        campaignId={deck.campaignId}
        style={themeStyles}
        className={className}
        onNotesChange={onNotesChange}
        readOnly={readOnly}
      >
        {visibleSlides.map((slide) => (
          <SemanticSlideRenderer
            key={slide.id}
            slide={slide}
            campaign={campaign}
            brandKit={brandKit}
          />
        ))}
      </Deck>
    </div>
  );
};
