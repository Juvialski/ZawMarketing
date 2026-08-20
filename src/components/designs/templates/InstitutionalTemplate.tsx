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

export const InstitutionalTemplate: React.FC<TemplateProps> = ({
  campaign,
  config,
  brandKit,
  heroImageUrl,
}) => {
  const allMetrics = getAvailableMetrics(campaign);
  const activeMetrics = allMetrics.filter((m) => config.activeMetricIds.includes(m.id));
  const displayedMetrics = activeMetrics.length > 0 ? activeMetrics : allMetrics.slice(0, 4);

  const isStory = config.aspectRatio === 'story';
  const isLandscape = config.aspectRatio === 'landscape';

  const headline = config.headline || campaign.sourceData.title;
  const subtitle = config.subtitle || campaign.sourceData.property?.investmentThesis || campaign.sourceData.targetMarket;
  const badgeText = config.customBadgeText || 'INVESTMENT MEMORANDUM';
  const ctaText = config.customCtaText || brandKit.preferredCta;

  return (
    <div className="relative w-full h-full bg-[#0a1128] text-slate-100 flex flex-col justify-between overflow-hidden select-none font-sans border-8 border-slate-900">
      {/* Top Institutional Header */}
      <div className="px-8 pt-6 pb-4 flex items-center justify-between border-b border-slate-800 bg-[#0f172a]/95">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-amber-500 rounded-none shrink-0" />
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-slate-200">
            {brandKit.companyName}
          </span>
        </div>
        <span className="inline-block px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/80">
          {badgeText}
        </span>
      </div>

      {/* Main Content Layout */}
      <div className="relative flex-1 flex flex-col justify-between px-8 py-5">
        {/* Title Section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              LOCATION:
            </span>
            <span className="text-[10px] font-mono uppercase text-slate-200 bg-slate-800/80 px-2 py-0.5">
              {campaign.sourceData.targetMarket}
            </span>
          </div>
          <h1
            className={`font-sans font-extrabold tracking-tight text-white leading-tight ${
              isStory ? 'text-2xl line-clamp-3' : isLandscape ? 'text-2xl line-clamp-2' : 'text-3xl line-clamp-2'
            }`}
          >
            {headline}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-2 font-normal line-clamp-2 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Photography + Grid Split */}
        <div className={`grid gap-4 my-3 ${isLandscape ? 'grid-cols-2 flex-1' : 'grid-cols-1 flex-1'}`}>
          {/* Photo Frame */}
          <div className="relative w-full h-full min-h-[140px] overflow-hidden border border-slate-700/80 bg-slate-950">
            <img
              src={heroImageUrl}
              alt={headline}
              className="w-full h-full object-cover"
              style={{
                objectPosition: `center ${config.imageCropY}%`,
                transform: `scale(${config.imageZoom})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 text-[9px] font-mono text-slate-300 uppercase">
              CONFIDENTIAL ASSET FILE
            </div>
          </div>

          {/* Underwriting Metrics Grid */}
          <div className={`grid gap-2 ${isLandscape ? 'grid-cols-1 content-center' : 'grid-cols-2'}`}>
            {displayedMetrics.slice(0, 4).map((metric) => (
              <div
                key={metric.id}
                className={`p-3 border flex flex-col justify-between ${
                  metric.highlight
                    ? 'bg-amber-950/30 border-amber-600/60 text-amber-200'
                    : 'bg-slate-900/90 border-slate-800 text-slate-100'
                }`}
              >
                <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                  {metric.label}
                </span>
                <span className="text-base sm:text-lg font-bold font-mono tracking-tight text-white mt-1">
                  {metric.value}
                </span>
                {metric.subtext && (
                  <span className="text-[9px] text-slate-400 mt-0.5">
                    {metric.subtext}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer with Institutional CTA */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono font-medium text-amber-400 truncate">
              {ctaText}
            </p>
            <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
              {brandKit.email} • {brandKit.licenseNumber || brandKit.phone}
            </p>
          </div>
          <div className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-mono px-4 py-2 uppercase tracking-wider shrink-0">
            ACQUIRE BRIEF
          </div>
        </div>

        {/* Disclaimer */}
        {config.showDisclaimer && (
          <p className="text-[7.5px] font-mono text-slate-500 mt-2 line-clamp-1">
            {brandKit.requiredDisclaimer}
          </p>
        )}
      </div>
    </div>
  );
};
