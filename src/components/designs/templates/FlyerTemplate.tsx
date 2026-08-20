import React from 'react';
import { Campaign, GraphicDesignConfig } from '../../../types/campaign';
import { BrandKit } from '../../../types/brandKit';
import { getAvailableMetrics } from '../../../utils/formatters';

interface FlyerTemplateProps {
  campaign: Campaign;
  config: GraphicDesignConfig;
  brandKit: BrandKit;
  heroImageUrl: string;
  isPrintMode?: boolean;
}

export const FlyerTemplate: React.FC<FlyerTemplateProps> = ({
  campaign,
  brandKit,
  heroImageUrl,
}) => {
  const prop = campaign.sourceData.property;
  const metrics = getAvailableMetrics(campaign);
  const images = campaign.sourceData.uploadedImages || [];
  const secondaryImages = images.filter((img) => img.url !== heroImageUrl).slice(0, 2);

  return (
    <div className="w-full h-full bg-white text-slate-900 p-8 sm:p-10 flex flex-col justify-between select-none font-sans box-border">
      {/* 1. Header & Branding */}
      <div className="pb-4 border-b-2 border-slate-900 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-600 shrink-0" />
            <h2 className="text-sm font-mono font-bold tracking-widest text-slate-900 uppercase">
              {brandKit.companyName}
            </h2>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight mt-1">
            {campaign.sourceData.title || prop?.address || 'Investment Memorandum'}
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            {prop ? `${prop.address}, ${prop.city}, ${prop.state} ${prop.zipCode || ''}` : campaign.sourceData.targetMarket}
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="inline-block px-2.5 py-1 bg-slate-900 text-white font-mono text-[10px] font-bold uppercase tracking-widest">
            {campaign.sourceData.campaignType.replace(/_/g, ' ')}
          </span>
          <p className="text-[10px] font-mono text-slate-500 mt-1">
            DATE: {new Date(campaign.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* 2. Photo Gallery (Hero + 2 Secondary) */}
      <div className="grid grid-cols-3 gap-3 my-4">
        <div className="col-span-2 relative h-56 sm:h-64 overflow-hidden border border-slate-300 bg-slate-100">
          <img
            src={heroImageUrl}
            alt="Hero Property"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 text-white text-[9px] font-mono uppercase">
            PRIMARY ELEVATION
          </div>
        </div>
        <div className="flex flex-col gap-3 h-56 sm:h-64">
          {secondaryImages.length > 0 ? (
            secondaryImages.map((img, idx) => (
              <div key={img.id || idx} className="relative flex-1 overflow-hidden border border-slate-300 bg-slate-100">
                <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
              </div>
            ))
          ) : (
            <div className="h-full border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center p-4 text-center">
              <span className="text-[10px] font-mono text-slate-400">Additional Photos In Deal Room</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Financial Metrics & Underwriting Table */}
      <div className="my-2">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-900 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 bg-slate-900" />
          EXECUTIVE UNDERWRITING METRICS
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {metrics.slice(0, 6).map((m) => (
            <div
              key={m.id}
              className={`p-2.5 border ${
                m.highlight ? 'bg-amber-50 border-amber-400' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-[8px] font-mono uppercase tracking-wider text-slate-500 block">
                {m.label}
              </span>
              <span className="text-sm sm:text-base font-bold font-mono text-slate-900 block mt-0.5">
                {m.value}
              </span>
              {m.subtext && <span className="text-[8px] text-slate-500 block">{m.subtext}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Property Specifications & Investment Highlights */}
      <div className="grid grid-cols-2 gap-4 my-2">
        <div className="p-3 bg-slate-50 border border-slate-200">
          <h4 className="text-[10px] font-mono font-bold uppercase text-slate-800 tracking-wider mb-2">
            PROPERTY SPECIFICATIONS
          </h4>
          <div className="grid grid-cols-2 gap-y-1.5 text-xs">
            <div><span className="text-slate-500">Type:</span> <span className="font-semibold text-slate-900">{prop?.propertyType || 'Single Family'}</span></div>
            <div><span className="text-slate-500">Bed / Bath:</span> <span className="font-semibold text-slate-900">{prop?.bedrooms || 3} / {prop?.bathrooms || 2}</span></div>
            <div><span className="text-slate-500">Square Feet:</span> <span className="font-semibold text-slate-900">{prop?.squareFeet?.toLocaleString() || '1,840'} SF</span></div>
            <div><span className="text-slate-500">Year Built:</span> <span className="font-semibold text-slate-900">{prop?.yearBuilt || '1978'}</span></div>
            <div><span className="text-slate-500">Lot Size:</span> <span className="font-semibold text-slate-900">{prop?.lotSizeSqFt?.toLocaleString() || '7,200'} SF</span></div>
            <div><span className="text-slate-500">Submarket:</span> <span className="font-semibold text-slate-900">{prop?.neighborhood || campaign.sourceData.targetMarket}</span></div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200">
          <h4 className="text-[10px] font-mono font-bold uppercase text-slate-800 tracking-wider mb-2">
            INVESTMENT HIGHLIGHTS
          </h4>
          <ul className="text-[11px] text-slate-700 space-y-1 list-disc list-inside">
            {(prop?.dealHighlights || [
              'Under-market entry basis with verified comparable sales support',
              'Cosmetic scope with rapid 60-day target disposition turnaround',
              'Located in high-demand submarket with low supply inventory',
            ]).slice(0, 3).map((h, i) => (
              <li key={i} className="line-clamp-1">{h}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* 5. Investment Thesis & Scope Summary */}
      <div className="p-3 border-l-2 border-amber-600 bg-amber-50/50 my-1">
        <h4 className="text-[10px] font-mono font-bold uppercase text-amber-900 tracking-wider mb-1">
          INVESTMENT THESIS & ACQUISITION RATIONALE
        </h4>
        <p className="text-xs text-slate-800 leading-relaxed line-clamp-2">
          {prop?.investmentThesis || campaign.strategy?.valueProposition || 'Acquisition of an off-market value-add asset positioned for substantial equity expansion.'}
        </p>
      </div>

      {/* 6. Footer: Contact & Required Legal Disclaimer */}
      <div className="pt-3 border-t-2 border-slate-900 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-900">{brandKit.companyName} Acquisitions</span>
            <span className="text-slate-500 ml-2 font-mono">{brandKit.phone} • {brandKit.email}</span>
          </div>
          <div className="text-right font-mono font-bold text-slate-900">
            {brandKit.website}
          </div>
        </div>
        <p className="text-[7.5px] text-slate-500 leading-tight">
          {brandKit.requiredDisclaimer} {brandKit.licenseNumber ? `| ${brandKit.licenseNumber}` : ''}
        </p>
      </div>
    </div>
  );
};
