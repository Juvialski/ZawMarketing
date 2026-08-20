import React from 'react';
import { Campaign } from '../../../types/campaign';
import { BrandKit } from '../../../types/brandKit';
import { DesignRenderer } from '../../../components/designs/DesignRenderer';
import Reveal from '../bolt/Reveal';
import { CreativeShowcaseSlide as CreativeShowcaseSlideType } from '../../../types/presentation';

interface CreativeShowcaseSlideProps {
  slide: CreativeShowcaseSlideType;
  campaign?: Campaign;
  brandKit?: BrandKit;
}

export const CreativeShowcaseSlide: React.FC<CreativeShowcaseSlideProps> = ({
  slide,
  campaign,
  brandKit,
}) => {
  const formats = slide.previewFormats || ['square', 'portrait', 'story', 'landscape'];

  const formatLabels: Record<string, string> = {
    square: '1:1 Instagram Square',
    portrait: '4:5 Feed Portrait',
    story: '9:16 Story / Reel',
    landscape: '1.91:1 LinkedIn / Web',
  };

  return (
    <div className="slide center">
      <div className="slide-container" style={{ maxWidth: 1200 }}>
        <Reveal>
          {slide.kicker && (
            <div className="kicker" style={{ marginBottom: 8, textAlign: 'center' }}>
              {slide.kicker}
            </div>
          )}
          <h2
            className="headline"
            style={{ textAlign: 'center', marginInline: 'auto', marginBottom: 8 }}
          >
            {slide.title}
          </h2>
          {slide.subtitle && (
            <p
              className="lead"
              style={{
                textAlign: 'center',
                marginInline: 'auto',
                marginBottom: 'clamp(20px, 3vh, 32px)',
                fontSize: 'clamp(14px, 1.4vw, 18px)',
              }}
            >
              {slide.subtitle}
            </p>
          )}
        </Reveal>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          {formats.map((fmt) => (
            <div
              key={fmt}
              className="mat"
              style={{
                padding: 12,
                borderRadius: 'var(--radius)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: 190,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0, 0, 0, 0.2)',
                }}
              >
                {campaign && brandKit ? (
                  <div style={{ transform: 'scale(0.35)', transformOrigin: 'center center' }}>
                    <DesignRenderer
                      campaign={campaign}
                      aspectRatio={fmt}
                      brandKit={brandKit}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: '80%',
                      height: '80%',
                      borderRadius: 8,
                      border: '1px dashed var(--hair)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--fg-muted)',
                    }}
                  >
                    {fmt.toUpperCase()}
                  </div>
                )}
              </div>
              <span className="kicker" style={{ fontSize: 10 }}>
                {formatLabels[fmt] || fmt}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
