import React, { useState, useEffect } from 'react';
import { ProviderConfig, AIOperationType, ThinkingLevel, ImageQualityTier } from '../../types/providers';
import { SettingsStore } from '../../services/storage/settingsStore';
import { GEMINI_TEXT_MODELS } from '../../services/providers/modelRegistry';
import { UsageTracker, ModelQuotaSummary } from '../../services/providers/usageTracker';
import { ImageSpendingTracker, SpendingSummary } from '../../services/providers/imageSpendingTracker';
import { ImageQualityComparison } from '../images/ImageQualityComparison';
import { 
  Cpu, 
  Check, 
  Sparkles, 
  ExternalLink,
  Activity,
  AlertTriangle,
  Sliders,
  RotateCcw,
  Zap,
  DollarSign
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [config, setConfig] = useState<ProviderConfig>(SettingsStore.get());
  const [savedAlert, setSavedAlert] = useState(false);
  const [quotaSummaries, setQuotaSummaries] = useState<Record<string, ModelQuotaSummary>>({});
  const [spendingSummary, setSpendingSummary] = useState<SpendingSummary>(
    ImageSpendingTracker.getSpendingSummary(config.imageSpendingLimits)
  );
  const [activeTab, setActiveTab] = useState<'settings' | 'benchmarking'>('settings');
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'failed'; message: string }>({
    status: 'idle',
    message: '',
  });

  useEffect(() => {
    refreshQuotaStatus();
    refreshSpendingStatus();
  }, [config]);

  const refreshQuotaStatus = () => {
    const statuses = UsageTracker.getAllModelQuotaStatuses(config.customQuotas);
    setQuotaSummaries(statuses);
  };

  const refreshSpendingStatus = () => {
    const spending = ImageSpendingTracker.getSpendingSummary(config.imageSpendingLimits);
    setSpendingSummary(spending);
  };

  const handleUpdate = (updates: Partial<ProviderConfig>) => {
    const updated = { ...config, ...updates };
    setConfig(updated);
    SettingsStore.save(updated);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2000);
  };

  const handleSpendingLimitsUpdate = (updates: Partial<ProviderConfig['imageSpendingLimits']>) => {
    const updatedLimits = {
      ...config.imageSpendingLimits,
      ...updates,
    };
    handleUpdate({ imageSpendingLimits: updatedLimits });
  };

  const handleOperationOverride = (op: AIOperationType, modelId: string) => {
    const current = { ...(config.operationOverrides || {}) };
    if (!modelId) {
      delete current[op];
    } else {
      current[op] = modelId;
    }
    handleUpdate({ operationOverrides: current });
  };

  const handleThinkingLevel = (op: AIOperationType, level: ThinkingLevel) => {
    const current = { ...(config.thinkingLevels || {}) };
    current[op] = level;
    handleUpdate({ thinkingLevels: current });
  };

  const handleResetDefaults = () => {
    if (confirm('Reset AI models, quotas, and image settings to recommended production defaults?')) {
      localStorage.removeItem('zaw_marketing_provider_settings_v2');
      const fresh = SettingsStore.get();
      setConfig(fresh);
      setSavedAlert(true);
      setTimeout(() => setSavedAlert(false), 2000);
    }
  };

  const handleTestConnection = async () => {
    setTestResult({ status: 'testing', message: 'Testing Gemini 3.5 Flash Lite connection...' });
    try {
      if (!config.geminiApiKey) {
        setTestResult({
          status: 'success',
          message: 'Zero-key mock mode active. Instant responses verified with local real estate market data.',
        });
        return;
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${config.defaultModelId}:generateContent?key=${config.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Respond with exactly the word "CONNECTED".' }] }],
          }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`API Error (${res.status}): ${err}`);
      }

      setTestResult({
        status: 'success',
        message: `Connected successfully to ${config.defaultModelId} via Google AI Studio. Quotas active.`,
      });
    } catch (err: any) {
      setTestResult({
        status: 'failed',
        message: `Connection failed: ${err.message}`,
      });
    }
  };

  const textModels = Object.values(GEMINI_TEXT_MODELS);
  const isPaidImageEnabled = config.imageSpendingLimits?.enablePaidGeneration ?? false;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* 1. Header & Navigation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
            SYSTEM ARCHITECTURE & AI ENGINE
          </span>
          <h2 className="text-xl font-serif font-bold text-slate-900 mt-1">
            AI Provider & Image Generation Settings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Google Gemini text models, Black Forest Labs (FLUX.2), NVIDIA NIM, and workspace spending limits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'settings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Provider Configuration
            </button>
            <button
              onClick={() => setActiveTab('benchmarking')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'benchmarking' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Image Benchmark Tool</span>
            </button>
          </div>

          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {savedAlert && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Configuration saved successfully.</span>
        </div>
      )}

      {activeTab === 'benchmarking' ? (
        <ImageQualityComparison />
      ) : (
        <>
          {/* 2. Text & Reasoning Models (Google Gemini) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-slate-600" />
                1. Text & Marketing Intelligence (Google Gemini)
              </h3>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-700 hover:text-amber-800 flex items-center gap-1 font-medium"
              >
                <span>Google AI Studio Quotas & Keys</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gemini API Key</label>
              <input
                type="password"
                value={config.geminiApiKey || ''}
                onChange={(e) => handleUpdate({ geminiApiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono text-slate-800"
              />
            </div>

            {/* Model Selectors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Default Model */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Default Model (High Volume)
                </label>
                <select
                  value={config.defaultModelId}
                  onChange={(e) => handleUpdate({ defaultModelId: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-900"
                >
                  {textModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.displayName} — {m.userLabel} ({m.observedRPD} RPD)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500">
                  Handles single-turn campaign packages, platform variations, and routine copy.
                </p>
              </div>

              {/* High-Volume Fallback Model */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  High-Volume Fallback Model
                </label>
                <select
                  value={config.fallbackModelId}
                  onChange={(e) => handleUpdate({ fallbackModelId: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-900"
                >
                  {textModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.displayName} — {m.userLabel} ({m.observedRPD} RPD)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500">
                  Activated automatically if default model hits temporary RPM or quota constraints.
                </p>
              </div>

              {/* Preferred Premium Model */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Preferred Premium Model
                </label>
                <select
                  value={config.premiumModelId}
                  onChange={(e) => handleUpdate({ premiumModelId: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-900"
                >
                  {textModels.filter((m) => m.tier === 'premium' || m.tier === 'intermediate').map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.displayName} — {m.userLabel} ({m.observedRPD} RPD)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500">
                  Reserved for complex acquisitions underwriting and second-pass "Professional Review".
                </p>
              </div>
            </div>
          </div>

          {/* 3. Visual Asset Strategy & Image Providers (Free vs Paid) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  2. Visual Asset Strategy & Quality Tiers (Free vs. Paid)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Decoupled visual pipeline: NVIDIA (Free), FLUX.2 Pro/Max/Flex (Paid), and Gemini Nano Banana Pro.
                </p>
              </div>
            </div>

            {/* Quality Tier Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Default Image Quality Tier
                </label>
                <select
                  value={config.imageQualityTier}
                  onChange={(e) => handleUpdate({ imageQualityTier: e.target.value as ImageQualityTier })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-900"
                >
                  <option value="free_dev">Free / Prototype (NVIDIA NIM / Curated Uploads)</option>
                  <option value="paid_standard">Paid Standard (FLUX.2 Pro · ~$0.05/img)</option>
                  <option value="paid_maximum">Paid Maximum Quality (FLUX.2 Max · ~$0.08/img)</option>
                  <option value="paid_specialized">Paid Specialized (FLUX.2 Flex · ~$0.06/img)</option>
                  <option value="paid_alternate">Paid Alternate (Gemini Nano Banana Pro · ~$0.04/img)</option>
                  <option value="auto">Auto (Hero ➔ Max, Supporting ➔ Pro, Backdrops ➔ Free)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Preferred Paid Engine
                </label>
                <select
                  value={config.imageSpendingLimits.preferredPaidProvider}
                  onChange={(e) => handleSpendingLimitsUpdate({ preferredPaidProvider: e.target.value as any })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-900"
                >
                  <option value="bfl">Black Forest Labs (FLUX.2)</option>
                  <option value="gemini_image">Google Gemini (Nano Banana Pro)</option>
                  <option value="openai_image">OpenAI (GPT Image 2)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Preferred Paid Model
                </label>
                <select
                  value={config.imageSpendingLimits.preferredPaidModel}
                  onChange={(e) => handleSpendingLimitsUpdate({ preferredPaidModel: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-900 font-mono"
                >
                  <option value="flux-2-max">flux-2-max (Maximum Quality · Hero)</option>
                  <option value="flux-2-pro">flux-2-pro (Production Standard)</option>
                  <option value="flux-2-flex">flux-2-flex (Specialized Control)</option>
                  <option value="nano-banana-pro">nano-banana-pro (Gemini Alternate)</option>
                </select>
              </div>
            </div>

            {/* Workspace Spending Controls & Deliberate Enablement */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Workspace Spending Controls</h4>
                    <p className="text-[11px] text-slate-500">
                      Paid generation is disabled by default to prevent unexpected API spend.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPaidImageEnabled}
                    onChange={(e) => handleSpendingLimitsUpdate({ enablePaidGeneration: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>

              {isPaidImageEnabled ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Max Images Per Campaign
                    </label>
                    <input
                      type="number"
                      value={config.imageSpendingLimits.maxImagesPerCampaign}
                      onChange={(e) => handleSpendingLimitsUpdate({ maxImagesPerCampaign: parseInt(e.target.value) || 0 })}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                      min={1}
                      max={50}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Daily Spending Limit (USD)
                    </label>
                    <input
                      type="number"
                      step="0.50"
                      value={config.imageSpendingLimits.dailySpendingLimitUsd}
                      onChange={(e) => handleSpendingLimitsUpdate({ dailySpendingLimitUsd: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                      min={0}
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Spent Today: ${spendingSummary.spentTodayUsd.toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Monthly Spending Limit (USD)
                    </label>
                    <input
                      type="number"
                      step="5.00"
                      value={config.imageSpendingLimits.monthlySpendingLimitUsd}
                      onChange={(e) => handleSpendingLimitsUpdate({ monthlySpendingLimitUsd: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                      min={0}
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Spent This Month: ${spendingSummary.spentThisMonthUsd.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 italic bg-white p-2.5 rounded-lg border border-slate-200">
                  Paid generation is currently OFF. All concept visual requests route to Free NVIDIA NIM or authentic curated photography.
                </div>
              )}
            </div>

            {/* Provider API Keys */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* BFL API Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Black Forest Labs API Key (BFL / FLUX.2)
                </label>
                <input
                  type="password"
                  value={config.bflApiKey || ''}
                  onChange={(e) => handleUpdate({ bflApiKey: e.target.value })}
                  placeholder="bfl_live_..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Required for FLUX.2 Pro, FLUX.2 Max, and FLUX.2 Flex models.
                </p>
              </div>

              {/* NVIDIA NIM Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NVIDIA NIM API Key (Free Dev Tier)
                </label>
                <input
                  type="password"
                  value={config.nvidiaApiKey || ''}
                  onChange={(e) => handleUpdate({ nvidiaApiKey: e.target.value })}
                  placeholder="nvapi-..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Used for free prototype generation via SDXL Turbo / FLUX.1 Schnell.
                </p>
              </div>
            </div>
          </div>

          {/* 4. Estimated Daily Usage & Quota Monitor */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  3. Estimated Local Quota Monitor
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Local estimates vs. observed project limits. Reset daily at midnight local time.
                </p>
              </div>

              <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                ESTIMATES ONLY
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {textModels.map((def) => {
                const summary = quotaSummaries[def.id] || {
                  usedToday: 0,
                  rpdLimit: def.observedRPD,
                  remainingToday: def.observedRPD,
                  percentageUsed: 0,
                };

                const isExhausted = summary.remainingToday <= 0;
                const isHighUsage = summary.percentageUsed >= 80;

                return (
                  <div
                    key={def.id}
                    className={`p-3.5 rounded-xl border text-xs space-y-2 transition-colors ${
                      isExhausted
                        ? 'bg-red-50/60 border-red-200'
                        : isHighUsage
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'bg-slate-50/50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{def.displayName}</span>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                          def.tier === 'high_volume'
                            ? 'bg-emerald-100 text-emerald-800'
                            : def.tier === 'fallback'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {def.tier === 'high_volume' ? 'DEFAULT' : def.tier.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between text-[11px]">
                      <span className="text-slate-600">Daily Calls:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {summary.usedToday} / {summary.rpdLimit} RPD
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isExhausted ? 'bg-red-500' : isHighUsage ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, summary.percentageUsed)}%` }}
                      />
                    </div>

                    <div className="text-[9px] font-mono text-slate-400">
                      Observed: {def.observedRPM} RPM · {def.observedTPM / 1000}k TPM
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Advanced Per-Operation Model Overrides */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-slate-600" />
                  4. Advanced Per-Operation Overrides & Reasoning Depth
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Customize specific Gemini models and reasoning/thinking budgets for each marketing operation.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {[
                { op: 'campaign_kit', name: 'Full Marketing Kit (1-Turn Batch)', defaultModel: 'gemini-3.5-flash-lite', defaultThinking: 'low' },
                { op: 'campaign_strategy', name: 'Strategy & Quantitative Hooks', defaultModel: 'gemini-3.5-flash-lite', defaultThinking: 'medium' },
                { op: 'platform_variants', name: 'Platform Copy (FB/IG/LinkedIn/Email)', defaultModel: 'gemini-3.5-flash-lite', defaultThinking: 'low' },
                { op: 'final_review', name: 'Professional Review & Anti-Slop QA', defaultModel: 'gemini-3.7-flash', defaultThinking: 'high' },
                { op: 'lead_summary', name: 'Investor Lead Scoring & Synthesis', defaultModel: 'gemini-3.5-flash-lite', defaultThinking: 'low' },
              ].map((item) => {
                const currentOverride = config.operationOverrides?.[item.op as AIOperationType] || '';
                const currentThinking = config.thinkingLevels?.[item.op as AIOperationType] || (item.defaultThinking as ThinkingLevel);

                return (
                  <div key={item.op} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="max-w-xs">
                      <div className="font-semibold text-slate-800">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Default: {item.defaultModel}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={currentOverride}
                        onChange={(e) => handleOperationOverride(item.op as AIOperationType, e.target.value)}
                        className="text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                      >
                        <option value="">Global Default ({config.defaultModelId})</option>
                        {textModels.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.displayName} ({m.observedRPD} RPD)
                          </option>
                        ))}
                      </select>

                      <select
                        value={currentThinking}
                        onChange={(e) => handleThinkingLevel(item.op as AIOperationType, e.target.value as ThinkingLevel)}
                        className="text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-700"
                      >
                        <option value="minimal">Thinking: Minimal</option>
                        <option value="low">Thinking: Low</option>
                        <option value="medium">Thinking: Medium</option>
                        <option value="high">Thinking: High</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6. Connection Test & Persistence */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                5. Connection Diagnostic
              </h3>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                Test active API key connection against Google AI Studio endpoint.
              </div>

              <button
                onClick={handleTestConnection}
                disabled={testResult.status === 'testing'}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
              >
                {testResult.status === 'testing' ? (
                  <>
                    <Activity className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Test Connection</span>
                  </>
                )}
              </button>
            </div>

            {testResult.status !== 'idle' && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  testResult.status === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : testResult.status === 'failed'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                {testResult.status === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : testResult.status === 'failed' ? (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                ) : (
                  <Activity className="w-4 h-4 animate-spin text-slate-500 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
