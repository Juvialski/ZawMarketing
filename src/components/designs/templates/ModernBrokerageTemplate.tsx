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

export const ModernBrokerageTemplate: React.FC<TemplateProps> = ({
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
  const subtitle = config.subtitle || campaign.sourceData.targetMarket;
  const badgeText = config.customBadgeText || 'JUST UNDERWRITTEN';
  const ctaText = config.customCtaText || brandKit.preferredCta;

  return (
    <div className="relative w-full h-full bg-zinc-950 text-white flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* Background Hero Photography with Dark Linear Gradient */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImageUrl}
          alt={headline}
          className="w-full h-full object-cover"
          style={{
            objectPosition: `center ${config.imageCropY}%`,
            transform: `scale(${config.imageZoom})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/50" />
      </div>

      {/* Top Header */}
      <div className="relative z-10 px-8 pt-7 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {brandKit.logoUrl ? (
            <img src={brandKit.logoUrl} alt={brandKit.companyName} className="h-6 object-contain" />
          ) : (
            <span className="font-extrabold tracking-tight text-white text-base">
              {brandKit.companyName}
            </span>
          )}
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500 text-zinc-950 shadow-md">
          {badgeText}
        </span>
      </div>

      {/* Center / Bottom Content */}
      <div className="relative z-10 px-8 pb-7 flex flex-col justify-end flex-1">
        {/* Market Tag */}
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-2">
          <span>●</span>
          <span>{campaign.sourceData.targetMarket}</span>
        </div>

        {/* Headline */}
        <h1
          className={`font-black tracking-tight text-white leading-tight mb-2 ${
            isStory ? 'text-3xl line-clamp-3' : isLandscape ? 'text-2xl line-clamp-2' : 'text-3xl sm:text-4xl line-clamp-2'
          }`}
        >
          {headline}
        </h1>

        {subtitle && (
          <p className="text-sm text-zinc-300 font-medium mb-4 line-clamp-2">
            {subtitle}
          </p>
        )}

        {/* Metric Pills / Cards */}
        <div className="grid grid-cols-3 gap-2.5 my-3">
          {displayedMetrics.slice(0, 3).map((metric) => (
            <div
              key={metric.id}
              className="bg-zinc-900/90 backdrop-blur-md p-2.5 rounded-lg border border-zinc-800 flex flex-col"
            >
              <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">
                {metric.label}
              </span>
              <span className="text-base sm:text-lg font-extrabold text-white font-mono-num mt-0.5">
                {metric.value}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Bar */}
        <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-zinc-200 truncate">
              {ctaText}
            </p>
            <p className="text-[11px] text-zinc-400 truncate">
              {brandKit.phone} • {brandKit.website}
            </p>
          </div>
          <div className="bg-white text-zinc-950 font-bold text-xs px-4 py-2 rounded-md uppercase tracking-wider shrink-0 shadow-lg">
            VIEW DETAILS
          </div>
        </div>

        {/* Disclaimer */}
        {config.showDisclaimer && (
          <p className="text-[8px] text-zinc-500 mt-2 line-clamp-1">
            {brandKit.requiredDisclaimer}
          </p>
        )}
      </div>
    </div>
  );
};
