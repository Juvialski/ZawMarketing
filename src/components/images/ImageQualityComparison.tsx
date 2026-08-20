import React, { useState } from 'react';
import { ImageCreativeBrief, GeneratedImageResult } from '../../types/providers';
import { SettingsStore } from '../../services/storage/settingsStore';
import { NvidiaImageProvider } from '../../services/providers/nvidiaImageProvider';
import { BflImageProvider } from '../../services/providers/bflImageProvider';
import { GeminiPaidImageProvider } from '../../services/providers/geminiImageProvider';
import { 
  Sparkles, 
  Star, 
  Layers, 
  RefreshCw
} from 'lucide-react';

interface ComparisonResult {
  providerId: string;
  providerLabel: string;
  modelId: string;
  costUsd: number;
  imageResult?: GeneratedImageResult;
  latencyMs?: number;
  error?: string;
  ratings?: {
    realism: number;
    composition: number;
    brandFit: number;
    promptAdherence: number;
    usefulness: number;
  };
}

export const ImageQualityComparison: React.FC = () => {
  const config = SettingsStore.get();
  const [prompt, setPrompt] = useState(
    'Exterior modern architectural single-family residence in Phoenix, AZ. Desert xeriscape, warm natural sunset lighting, crisp vertical lines, commercial photography.'
  );
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '16:9'>('1:1');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ComparisonResult[]>([
    { providerId: 'nvidia', providerLabel: 'NVIDIA (SDXL Turbo)', modelId: 'stabilityai/sdxl-turbo', costUsd: 0.0 },
    { providerId: 'bfl-pro', providerLabel: 'FLUX.2 Pro (Standard)', modelId: 'flux-2-pro', costUsd: 0.05 },
    { providerId: 'bfl-max', providerLabel: 'FLUX.2 Max (Maximum Quality)', modelId: 'flux-2-max', costUsd: 0.08 },
    { providerId: 'gemini', providerLabel: 'Gemini Nano Banana Pro', modelId: 'nano-banana-pro', costUsd: 0.04 },
  ]);

  const runComparison = async () => {
    setIsRunning(true);

    const brief: ImageCreativeBrief = {
      purpose: 'hero',
      subject: prompt,
      aspectRatio,
      style: 'architectural_photography',
      brandColors: ['#0f172a', '#c85a32'],
      isConceptual: true,
    };

    const updated = [...results];

    // 1. NVIDIA
    try {
      const nvidia = new NvidiaImageProvider(config.nvidiaApiKey, 'stabilityai/sdxl-turbo', config.nvidiaBaseUrl);
      const t0 = Date.now();
      const res = await nvidia.generateFromBrief(brief);
      updated[0] = {
        ...updated[0],
        imageResult: res,
        latencyMs: Date.now() - t0,
        error: undefined,
      };
    } catch (err: any) {
      updated[0] = { ...updated[0], error: err.message };
    }

    // 2. FLUX.2 Pro
    try {
      const bflPro = new BflImageProvider(config.bflApiKey, 'flux-2-pro', config.bflBaseUrl);
      const t0 = Date.now();
      const res = await bflPro.generateFromBrief({ ...brief, qualityTier: 'paid_standard' });
      updated[1] = {
        ...updated[1],
        imageResult: res,
        latencyMs: Date.now() - t0,
        error: undefined,
      };
    } catch (err: any) {
      updated[1] = { ...updated[1], error: err.message };
    }

    // 3. FLUX.2 Max
    try {
      const bflMax = new BflImageProvider(config.bflApiKey, 'flux-2-max', config.bflBaseUrl);
      const t0 = Date.now();
      const res = await bflMax.generateFromBrief({ ...brief, qualityTier: 'paid_maximum' });
      updated[2] = {
        ...updated[2],
        imageResult: res,
        latencyMs: Date.now() - t0,
        error: undefined,
      };
    } catch (err: any) {
      updated[2] = { ...updated[2], error: err.message };
    }

    // 4. Gemini Nano Banana Pro
    try {
      const gemini = new GeminiPaidImageProvider(config.geminiApiKey, 'nano-banana-pro');
      const t0 = Date.now();
      const res = await gemini.generateFromBrief({ ...brief, qualityTier: 'paid_alternate' });
      updated[3] = {
        ...updated[3],
        imageResult: res,
        latencyMs: Date.now() - t0,
        error: undefined,
      };
    } catch (err: any) {
      updated[3] = { ...updated[3], error: err.message };
    }

    setResults(updated);
    setIsRunning(false);
  };

  const handleRating = (index: number, dimension: keyof NonNullable<ComparisonResult['ratings']>, score: number) => {
    setResults((prev) => {
      const next = [...prev];
      const currentRatings = next[index].ratings || {
        realism: 4,
        composition: 4,
        brandFit: 4,
        promptAdherence: 4,
        usefulness: 4,
      };
      next[index] = {
        ...next[index],
        ratings: {
          ...currentRatings,
          [dimension]: score,
        },
      };
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Benchmark Control Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-bold">
            DEVELOPER BENCHMARK TOOL
          </span>
          <h3 className="text-lg font-serif font-bold text-slate-900 mt-1">
            Side-by-Side Image Engine Quality Comparison
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate prompt adherence, architectural realism, and lighting across NVIDIA, FLUX.2 Pro, FLUX.2 Max, and Gemini.
          </p>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">Standardized Benchmark Prompt</label>
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 font-sans focus:ring-1 focus:ring-slate-900 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Aspect Ratio:</span>
            {(['1:1', '4:5', '16:9'] as const).map((ar) => (
              <button
                key={ar}
                onClick={() => setAspectRatio(ar)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  aspectRatio === ar
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {ar}
              </button>
            ))}
          </div>

          <button
            onClick={runComparison}
            disabled={isRunning}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Benchmarking 4 Engines...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Run Quality Comparison</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {results.map((res, idx) => {
          const ratings = res.ratings || { realism: 0, composition: 0, brandFit: 0, promptAdherence: 0, usefulness: 0 };
          const hasImage = Boolean(res.imageResult?.url);

          return (
            <div
              key={res.providerId}
              className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{res.providerLabel}</h4>
                  <span className="text-[10px] font-mono text-slate-500">{res.modelId}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold text-slate-700 block">
                    {res.costUsd > 0 ? `~$${res.costUsd.toFixed(2)}` : 'FREE'}
                  </span>
                  {res.latencyMs && (
                    <span className="text-[9px] font-mono text-slate-400">
                      {(res.latencyMs / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
              </div>

              {/* Image Preview Canvas */}
              <div className="aspect-square bg-slate-100 relative overflow-hidden flex items-center justify-center">
                {hasImage ? (
                  <img
                    src={res.imageResult!.url}
                    alt={res.providerLabel}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-6 text-center text-slate-400 space-y-2">
                    <Layers className="w-8 h-8 mx-auto stroke-1" />
                    <p className="text-[11px]">Click "Run Quality Comparison" to benchmark</p>
                  </div>
                )}
                {res.imageResult?.isAiIllustrative && (
                  <span className="absolute bottom-2 left-2 text-[9px] font-mono bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
                    CONCEPT VISUAL
                  </span>
                )}
              </div>

              {/* Interactive Rating Matrix */}
              <div className="p-3.5 space-y-2.5 text-xs text-slate-700 flex-1">
                {(
                  [
                    { key: 'realism', label: 'Photorealism' },
                    { key: 'composition', label: 'Composition' },
                    { key: 'promptAdherence', label: 'Prompt Adherence' },
                    { key: 'usefulness', label: 'Deal Marketing Utility' },
                  ] as const
                ).map((dim) => (
                  <div key={dim.key} className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-600">{dim.label}</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRating(idx, dim.key, star)}
                          className={`p-0.5 hover:text-amber-500 transition-colors ${
                            ratings[dim.key] >= star ? 'text-amber-500' : 'text-slate-200'
                          }`}
                        >
                          <Star className="w-3 h-3 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
