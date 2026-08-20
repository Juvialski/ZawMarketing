import React from 'react';
import { Campaign, GraphicDesignConfig } from '../../../types/campaign';
import { BrandKit } from '../../../types/brandKit';
import { getAvailableMetrics } from '../../../utils/formatters';

interface TemplateProps {
  campaign: Campaign;
  config: GraphicDesignConfig;
  brandKit: BrandKit;
  heroImageUrl: string;
}

export const EditorialTemplate: React.FC<TemplateProps> = ({
  campaign,
  config,
  brandKit,
  heroImageUrl,
}) => {
  const allMetrics = getAvailableMetrics(campaign);
  const activeMetrics = allMetrics.filter((m) => config.activeMetricIds.includes(m.id));
  const displayedMetrics = activeMetrics.length > 0 ? activeMetrics : allMetrics.slice(0, 3);

  const isStory = config.aspectRatio === 'story';
  const isLandscape = config.aspectRatio === 'landscape';

  const headline = config.headline || campaign.sourceData.title;
  const subtitle = config.subtitle || campaign.sourceData.property?.neighborhood || campaign.sourceData.targetMarket;
  const badgeText = config.customBadgeText || 'EXCLUSIVE OPPORTUNITY';
  const ctaText = config.customCtaText || brandKit.preferredCta;

  return (
    <div className="relative w-full h-full bg-[#fdfbf7] text-[#1a1918] flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* Top Header Bar */}
      <div className="px-8 pt-7 pb-4 flex items-center justify-between border-b border-[#e8e5de]/80 z-10 bg-[#fdfbf7]/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {brandKit.logoUrl ? (
            <img src={brandKit.logoUrl} alt={brandKit.companyName} className="h-7 object-contain" />
          ) : (
            <div className="font-serif font-bold tracking-tight text-lg text-slate-900">
              {brandKit.companyName.toUpperCase()}
            </div>
          )}
        </div>
        <div className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#78736b] bg-[#e8e5de]/60 border border-[#e8e5de]">
          {badgeText}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 flex flex-col justify-between px-8 py-6 z-10">
        {/* Title and Subtitle Block */}
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.2em] font-medium text-[#c85a32] mb-2 font-mono">
            {campaign.sourceData.targetMarket}
          </p>
          <h1
            className={`font-serif text-[#1a1918] font-bold tracking-tight leading-[1.1] ${
              isStory ? 'text-3xl line-clamp-3' : isLandscape ? 'text-2xl line-clamp-2' : 'text-3xl sm:text-4xl line-clamp-2'
            }`}
          >
            {headline}
          </h1>
          {subtitle && (
            <p className="text-sm text-[#78736b] mt-2 font-light line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Hero Image Block with Controlled Pan & Zoom */}
        <div className="relative flex-1 min-h-[160px] my-3 overflow-hidden border border-[#e8e5de] shadow-sm bg-slate-100 group">
          <img
            src={heroImageUrl}
            alt={headline}
            className="w-full h-full object-cover transition-transform duration-300"
            style={{
              objectPosition: `center ${config.imageCropY}%`,
              transform: `scale(${config.imageZoom})`,
            }}
          />
          {/* Subtle vignette gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 pointer-events-none" />

          {/* Floating Metric Badges on Photo */}
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 z-10">
            {displayedMetrics.slice(0, isStory ? 3 : isLandscape ? 3 : 4).map((metric) => (
              <div
                key={metric.id}
                className="bg-white/95 backdrop-blur-md px-3 py-1.5 border border-white/40 shadow-sm flex flex-col"
              >
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">
                  {metric.label}
                </span>
                <span className="text-sm font-bold text-slate-900 font-mono-num">
                  {metric.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action and Contact Footer */}
        <div className="pt-3 border-t border-[#e8e5de] flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate uppercase tracking-wider">
              {ctaText}
            </p>
            <p className="text-[11px] text-slate-500 truncate font-mono">
              {brandKit.phone} • {brandKit.website}
            </p>
          </div>
          <div className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 uppercase tracking-wider shrink-0 shadow-sm">
            INQUIRE
          </div>
        </div>

        {/* Legal Disclaimer */}
        {config.showDisclaimer && (
          <p className="text-[8px] text-slate-400 mt-2 line-clamp-1 leading-tight">
            {brandKit.requiredDisclaimer}
          </p>
        )}
      </div>
    </div>
  );
};
