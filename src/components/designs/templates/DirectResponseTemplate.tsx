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

export const DirectResponseTemplate: React.FC<TemplateProps> = ({
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
  const badgeText = config.customBadgeText || 'OFF-MARKET DEAL SPREAD';
  const ctaText = config.customCtaText || 'REQUEST UNDERWRITING PRO FORMA';

  const spreadMetric = allMetrics.find((m) => m.id === 'spread');
  const purchaseMetric = allMetrics.find((m) => m.id === 'purchase');
  const arvMetric = allMetrics.find((m) => m.id === 'arv');

  return (
    <div className="relative w-full h-full bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none font-sans border-4 border-emerald-500">
      {/* Top Urgent Bar */}
      <div className="bg-emerald-500 text-slate-950 px-6 py-2 flex items-center justify-between font-black text-xs uppercase tracking-wider">
        <span>{brandKit.companyName}</span>
        <span className="bg-slate-950 text-emerald-400 px-2 py-0.5 font-mono text-[10px]">
          {badgeText}
        </span>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col justify-between p-6">
        {/* Headline */}
        <div>
          <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-1">
            📍 {campaign.sourceData.targetMarket}
          </span>
          <h1
            className={`font-black tracking-tight leading-tight text-white ${
              isStory ? 'text-2xl line-clamp-3' : isLandscape ? 'text-xl line-clamp-2' : 'text-2xl sm:text-3xl line-clamp-2'
            }`}
          >
            {headline}
          </h1>
        </div>

        {/* Spread Highlight Card */}
        {spreadMetric && (
          <div className="bg-gradient-to-r from-emerald-950/80 to-slate-900 border-2 border-emerald-500/80 p-3 my-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold block">
                PROJECTED GROSS SPREAD
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-300">
                {spreadMetric.value}
              </span>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-mono">
                ENTRY: <span className="text-white font-bold">{purchaseMetric?.value || '$285k'}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                ARV: <span className="text-emerald-400 font-bold">{arvMetric?.value || '$390k'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Photo + Mini Metrics */}
        <div className="relative flex-1 min-h-[120px] my-2 overflow-hidden border border-slate-800 bg-slate-900">
          <img
            src={heroImageUrl}
            alt={headline}
            className="w-full h-full object-cover"
            style={{
              objectPosition: `center ${config.imageCropY}%`,
              transform: `scale(${config.imageZoom})`,
            }}
          />
          <div className="absolute bottom-2 left-2 right-2 flex gap-2">
            {displayedMetrics.slice(0, 3).map((metric) => (
              <div key={metric.id} className="bg-slate-950/90 border border-slate-700 px-2 py-1 flex-1 text-center">
                <span className="text-[8px] font-mono text-slate-400 block uppercase">{metric.label}</span>
                <span className="text-xs font-bold text-white font-mono">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Direct CTA */}
        <div className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-3 text-center font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer">
          {ctaText} ➔
        </div>

        {/* Contact Strip */}
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-2">
          <span>{brandKit.phone}</span>
          <span>{brandKit.email}</span>
          <span>{brandKit.website}</span>
        </div>
      </div>
    </div>
  );
};
