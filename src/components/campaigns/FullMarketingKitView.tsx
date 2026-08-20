import React, { useState } from 'react';
import { Campaign } from '../../types/campaign';
import { BrandKit } from '../../types/brandKit';
import { ProviderManager } from '../../services/providers/aiProvider';
import { DesignRenderer } from '../designs/DesignRenderer';
import { MarketingKitZipExporter } from '../../services/export/marketingKitZip';
import { 
  Sparkles, 
  Download, 
  RefreshCw, 
  FileText, 
  Image as ImageIcon, 
  Share2,
  Check
} from 'lucide-react';

interface FullMarketingKitViewProps {
  campaign: Campaign;
  brandKit: BrandKit;
  onUpdateCampaign: (updated: Campaign) => void;
}

export const FullMarketingKitView: React.FC<FullMarketingKitViewProps> = ({
  campaign,
  brandKit,
  onUpdateCampaign,
}) => {
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [currentStepName, setCurrentStepName] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [isZipping, setIsZipping] = useState(false);
  const [zipMessage, setZipMessage] = useState('');

  const handleGenerateFullKit = async () => {
    setIsGeneratingAll(true);
    setProgressPercent(10);
    setCurrentStepName('Phase 1: Synthesizing Campaign Strategy & Audience Hooks...');

    try {
      const ai = ProviderManager.getAIProvider();

      // Step 1: Strategy
      const strategy = await ai.generateStrategy(
        campaign.sourceData,
        brandKit,
        (step, pct) => {
          setCurrentStepName(step);
          setProgressPercent(Math.round(pct * 0.4));
        }
      );

      // Step 2: Copy
      setCurrentStepName('Phase 2: Writing Multi-Platform Copy & Video Scripts...');
      const copy = await ai.generateCopy(
        campaign.sourceData,
        strategy,
        brandKit,
        (step, pct) => {
          setCurrentStepName(step);
          setProgressPercent(40 + Math.round(pct * 0.5));
        }
      );

      // Step 3: Complete Campaign
      setCurrentStepName('Phase 3: Building Deterministic Graphic Renderings...');
      setProgressPercent(95);

      const updatedCampaign: Campaign = {
        ...campaign,
        status: 'completed',
        strategy,
        copy,
      };

      onUpdateCampaign(updatedCampaign);
      setProgressPercent(100);
      setCurrentStepName('Full Marketing Kit Package Ready!');
    } catch (err) {
      console.error('Failed to generate full marketing kit', err);
      alert('Generation encountered an error. Please try again.');
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    setZipMessage('Initializing bundle...');
    try {
      await MarketingKitZipExporter.bundleAndDownloadKit(
        campaign,
        brandKit,
        (msg, pct) => {
          setZipMessage(`${msg} (${pct}%)`);
        }
      );
    } catch (err) {
      console.error('Failed to export ZIP', err);
      alert('Export failed. Please ensure graphics are rendered on screen.');
    } finally {
      setIsZipping(false);
      setZipMessage('');
    }
  };

  const isKitReady = Boolean(campaign.strategy && campaign.copy);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-subtle flex flex-wrap items-center justify-between gap-6">
        <div className="max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-bold">
              ONE-CLICK CAMPAIGN PACKAGE
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Status: {campaign.status.toUpperCase()}
            </span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-2">
            Full Marketing Kit Studio
          </h2>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Generate and export the entire asset suite in one coordinated pipeline: strategy brief, multi-platform copy, short-form video reel script, 4 social graphic variants, and a printable investment memorandum flyer.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleGenerateFullKit}
            disabled={isGeneratingAll}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isGeneratingAll ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-400" />
            )}
            <span>{isGeneratingAll ? 'Generating Full Kit...' : 'Generate Full Marketing Kit'}</span>
          </button>

          {isKitReady && (
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isZipping ? zipMessage || 'Packaging ZIP...' : 'Download Kit (.ZIP)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Generation Progress Tracker */}
      {isGeneratingAll && (
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-elevated space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-amber-400 font-bold uppercase">{currentStepName}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* 3. Asset Overview Grid */}
      {isKitReady && (
        <div className="space-y-8">
          {/* Summary KPI Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-500 uppercase">Strategy</div>
                <div className="text-xs font-bold text-slate-900">Quantifiable Hooks Ready</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-500 uppercase">Platform Copy</div>
                <div className="text-xs font-bold text-slate-900">5 Channels + Video</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center text-purple-700">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-500 uppercase">Graphics</div>
                <div className="text-xs font-bold text-slate-900">4 Format Renders</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-500 uppercase">Printable Flyer</div>
                <div className="text-xs font-bold text-slate-900">US Letter & A4 PDF</div>
              </div>
            </div>
          </div>

          {/* Rendered Graphics Gallery */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
              Generated Visual Marketing Assets
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              {/* Instagram Square */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-subtle space-y-2">
                <span className="text-[10px] font-mono font-bold text-slate-600 uppercase block">
                  Instagram Square (1:1)
                </span>
                <div className="bg-slate-100 p-2 rounded-lg">
                  <DesignRenderer
                    id="rendered-design-square"
                    campaign={campaign}
                    aspectRatio="square"
                    brandKit={brandKit}
                    className="rounded shadow-sm"
                  />
                </div>
              </div>

              {/* Instagram Portrait */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-subtle space-y-2">
                <span className="text-[10px] font-mono font-bold text-slate-600 uppercase block">
                  Instagram Portrait (4:5)
                </span>
                <div className="bg-slate-100 p-2 rounded-lg">
                  <DesignRenderer
                    id="rendered-design-portrait"
                    campaign={campaign}
                    aspectRatio="portrait"
                    brandKit={brandKit}
                    className="rounded shadow-sm"
                  />
                </div>
              </div>

              {/* Story / Reel */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-subtle space-y-2">
                <span className="text-[10px] font-mono font-bold text-slate-600 uppercase block">
                  Story / Reel (9:16)
                </span>
                <div className="bg-slate-100 p-2 rounded-lg">
                  <DesignRenderer
                    id="rendered-design-story"
                    campaign={campaign}
                    aspectRatio="story"
                    brandKit={brandKit}
                    className="rounded shadow-sm"
                  />
                </div>
              </div>

              {/* Landscape Banner */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-subtle space-y-2">
                <span className="text-[10px] font-mono font-bold text-slate-600 uppercase block">
                  LinkedIn & Facebook Banner (1.91:1)
                </span>
                <div className="bg-slate-100 p-2 rounded-lg">
                  <DesignRenderer
                    id="rendered-design-landscape"
                    campaign={campaign}
                    aspectRatio="landscape"
                    brandKit={brandKit}
                    className="rounded shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Printable Flyer Preview */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                  Printable Investment Memorandum Flyer
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  High-resolution 300 DPI vector layout formatted for standard US Letter & A4 paper.
                </p>
              </div>
            </div>

            <div className="bg-slate-100 p-6 rounded-xl flex justify-center">
              <div className="w-full max-w-2xl">
                <DesignRenderer
                  id="rendered-design-flyer_letter"
                  campaign={campaign}
                  aspectRatio="flyer_letter"
                  brandKit={brandKit}
                  className="rounded-lg shadow-flyer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
