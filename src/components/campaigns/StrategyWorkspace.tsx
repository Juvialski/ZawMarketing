import React, { useState } from 'react';
import { Campaign, CampaignStrategy } from '../../types/campaign';
import { BrandKit } from '../../types/brandKit';
import { ProviderManager } from '../../services/providers/aiProvider';
import { 
  Target, 
  Lightbulb, 
  CheckCircle2, 
  RefreshCw, 
  Compass, 
  Flame, 
  Layers,
  ArrowRight
} from 'lucide-react';

interface StrategyWorkspaceProps {
  campaign: Campaign;
  brandKit: BrandKit;
  onSaveStrategy: (strategy: CampaignStrategy) => void;
  onProceedToCopy?: () => void;
}

export const StrategyWorkspace: React.FC<StrategyWorkspaceProps> = ({
  campaign,
  brandKit,
  onSaveStrategy,
  onProceedToCopy,
}) => {
  const [strategy, setStrategy] = useState<CampaignStrategy | undefined>(campaign.strategy);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');

  const handleGenerateStrategy = async () => {
    setIsGenerating(true);
    setProgressMsg('Analyzing source data & target market economics...');

    try {
      const provider = ProviderManager.getAIProvider();
      const generated = await provider.generateStrategy(
        campaign.sourceData,
        brandKit,
        (step) => setProgressMsg(step)
      );
      setStrategy(generated);
      onSaveStrategy(generated);
    } catch (err) {
      console.error('Failed to generate strategy', err);
    } finally {
      setIsGenerating(false);
      setProgressMsg('');
    }
  };

  if (!strategy) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-2xl mx-auto space-y-5">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-700">
          <Compass className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-serif font-bold text-slate-900">
            No Campaign Strategy Generated Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Synthesize market positioning, target audience pain points, primary value proposition, and quantifiable hooks before writing copy.
          </p>
        </div>

        <button
          onClick={handleGenerateStrategy}
          disabled={isGenerating}
          className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm inline-flex items-center gap-2"
        >
          {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <SparklesIcon className="w-4 h-4 text-amber-400" />}
          <span>{isGenerating ? progressMsg || 'Synthesizing...' : 'Generate Campaign Strategy'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            STRATEGY DOSSIER
          </span>
          <h2 className="text-xl font-serif font-bold text-slate-900 mt-1">
            Marketing Intelligence & Positioning
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Core thesis and quantifiable hooks driving multi-platform copy generation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateStrategy}
            disabled={isGenerating}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Regenerating...' : 'Regenerate'}</span>
          </button>

          {onProceedToCopy && (
            <button
              onClick={onProceedToCopy}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-2"
            >
              <span>Proceed to Copy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Strategy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Core Angle & Value Prop */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
            <Flame className="w-4 h-4 text-amber-600" />
            Core Angle & Thesis
          </div>

          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/80">
            <span className="text-[9px] font-mono uppercase tracking-wider text-amber-900 block font-bold">
              PRIMARY CAMPAIGN HOOK
            </span>
            <p className="text-sm font-serif font-bold text-slate-900 mt-1">
              "{strategy.coreAngle}"
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-700 block mb-1">Value Proposition</span>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              {strategy.valueProposition}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-700 block mb-1">Campaign Objective</span>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              {strategy.primaryObjective}
            </p>
          </div>
        </div>

        {/* 2. Target Audience Profile */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
            <Target className="w-4 h-4 text-slate-600" />
            Target Audience Profile
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900">{strategy.targetAudience.name}</h4>
            <p className="text-xs text-slate-500 mt-1">{strategy.targetAudience.description}</p>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-700 block mb-2">Core Motivations</span>
            <ul className="space-y-1.5">
              {strategy.targetAudience.motivations.map((m, idx) => (
                <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-700 block mb-2">Pain Points Addressed</span>
            <ul className="space-y-1.5">
              {strategy.targetAudience.painPoints.map((p, idx) => (
                <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3. Key Quantitative Hooks */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            Key Quantitative Hooks
          </div>

          <div className="space-y-2">
            {strategy.keyHooks.map((hook, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                  #{idx + 1}
                </span>
                <span className="text-xs font-medium text-slate-800">{hook}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Supporting Comp Evidence */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-slate-600" />
            Supporting Underwriting & Comps
          </div>

          <div className="space-y-2">
            {strategy.supportingEvidence.map((evidence, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                • {evidence}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}
