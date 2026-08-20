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

export const MarketIntelligenceTemplate: React.FC<TemplateProps> = ({
  campaign,
  config,
  brandKit,
  heroImageUrl,
}) => {
  const allMetrics = getAvailableMetrics(campaign);
  const headline = config.headline || campaign.sourceData.title;
  const subtitle = config.subtitle || campaign.sourceData.targetMarket;
  const isLandscape = config.aspectRatio === 'landscape';

  return (
    <div className="relative w-full h-full bg-[#0b132b] text-slate-100 flex flex-col justify-between overflow-hidden select-none font-sans border border-slate-800">
      {/* Top Header */}
      <div className="px-8 pt-6 pb-3 flex items-center justify-between border-b border-slate-800 bg-[#1c2541]/40">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-xs font-semibold text-slate-300 tracking-wider">
            {brandKit.companyName.toUpperCase()} • RESEARCH
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 bg-cyan-950/60 px-2 py-0.5 border border-cyan-800">
          MARKET INTELLIGENCE REPORT
        </span>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-between px-8 py-5">
        <div>
          <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-1">
            SUBMARKET ANALYSIS // {campaign.sourceData.targetMarket}
          </div>
          <h1 className="font-sans font-bold text-2xl sm:text-3xl text-white tracking-tight leading-tight line-clamp-2">
            {headline}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1 font-mono line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Data Cards & Insight Graph Representation */}
        <div className={`grid gap-3 my-3 ${isLandscape ? 'grid-cols-2 flex-1' : 'grid-cols-1 flex-1'}`}>
          <div className="relative overflow-hidden border border-slate-800 bg-slate-900/60">
            <img
              src={heroImageUrl}
              alt={headline}
              className="w-full h-full object-cover"
              style={{
                objectPosition: `center ${config.imageCropY}%`,
                transform: `scale(${config.imageZoom})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b132b] via-transparent to-transparent" />
          </div>

          <div className="flex flex-col justify-between gap-2">
            <div className="p-3 bg-[#1c2541]/60 border border-slate-800">
              <span className="text-[9px] font-mono uppercase text-cyan-300 block mb-1">
                KEY INVESTMENT TAKEAWAY
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-3">
                {campaign.strategy?.coreAngle || campaign.sourceData.property?.investmentThesis || 'Market liquidity supports immediate deployment for disciplined value-add operators.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {allMetrics.slice(0, 2).map((m) => (
                <div key={m.id} className="p-2 bg-slate-900 border border-slate-800">
                  <span className="text-[8px] font-mono text-slate-400 block">{m.label}</span>
                  <span className="text-sm font-bold font-mono text-cyan-300">{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>{brandKit.website}</span>
          <span className="text-cyan-400 font-semibold">{brandKit.phone}</span>
        </div>
      </div>
    </div>
  );
};
