import React, { useState } from 'react';
import { ProviderConfig } from '../../types/providers';
import { SettingsStore } from '../../services/storage/settingsStore';
import { 
  Cpu, 
  Database, 
  Check, 
  Sparkles, 
  ExternalLink
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [config, setConfig] = useState<ProviderConfig>(SettingsStore.get());
  const [savedAlert, setSavedAlert] = useState(false);

  const handleUpdate = (updates: Partial<ProviderConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    SettingsStore.save(config);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-bold">
              SYSTEM CONFIGURATION
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 mt-1">
            Provider Architecture & Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Google Gemini API credentials, image generation endpoints, and cloud persistence.
          </p>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-amber-400" />
          <span>Save Configuration</span>
        </button>
      </div>

      {savedAlert && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Settings saved! The application will use the updated provider configuration immediately.</span>
        </div>
      )}

      {/* Mode Status Card */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${config.geminiApiKey ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              ACTIVE ENGINE: {config.geminiApiKey ? 'LIVE GOOGLE GEMINI' : 'HIGH-FIDELITY LOCAL MOCK FIXTURE'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {config.geminiApiKey ? 'API Connected' : 'Zero-Key Local Mode'}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {config.geminiApiKey
            ? `Live AI generation is active using ${config.geminiModel} for strategy and copywriting. Visual layouts remain deterministically rendered.`
            : `No API key entered. The studio is running in full local mode with pre-configured real estate market fixtures, allowing instant demonstration and testing of all features without requiring paid credentials.`}
        </p>
      </div>

      {/* 1. AI Provider (Google Gemini) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-600" />
            AI Strategy & Copy Provider (Google Gemini)
          </h3>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-amber-700 hover:text-amber-800 flex items-center gap-1 font-medium"
          >
            <span>Get Gemini API Key</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Gemini API Key</label>
            <input
              type="password"
              value={config.geminiApiKey || ''}
              onChange={(e) => handleUpdate({ geminiApiKey: e.target.value })}
              placeholder="AIzaSy..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Keys are stored strictly in local browser storage on your PC and never transmitted elsewhere.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Gemini Model</label>
            <select
              value={config.geminiModel}
              onChange={(e) => handleUpdate({ geminiModel: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
            >
              <option value="gemini-3.7-flash">gemini-3.7-flash (Recommended — Fast & Agentic)</option>
              <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Lowest Latency)</option>
              <option value="gemini-2.5-pro">gemini-2.5-pro (Deep Reasoning)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Image Provider Configuration */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-5">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-slate-600" />
          Image Provider Strategy
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Default Image Provider</label>
            <select
              value={config.imageProvider}
              onChange={(e) => handleUpdate({ imageProvider: e.target.value as any })}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
            >
              <option value="upload">Authentic Uploaded Photography (Recommended for Real Deals)</option>
              <option value="gemini">Gemini Illustrative Concept Engine (AI Generated)</option>
              <option value="nvidia">NVIDIA NIM Endpoint (External)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Gemini Image Model</label>
            <input
              type="text"
              value={config.geminiImageModel}
              onChange={(e) => handleUpdate({ geminiImageModel: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* 3. Future Supabase Cloud Persistence Placeholder */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-600" />
            Supabase Cloud Persistence (Future Extensibility)
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Optional for Local Prototype</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Supabase URL</label>
            <input
              type="text"
              placeholder="https://your-project.supabase.co"
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-slate-50 font-mono text-slate-500"
              disabled
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Supabase Anon Key</label>
            <input
              type="password"
              placeholder="eyJhbGciOi..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-slate-50 font-mono text-slate-500"
              disabled
            />
          </div>
        </div>
        <p className="text-[10px] text-slate-400">
          The local prototype uses typed browser storage. When connecting to production Supabase, configure environment variables in `.env`.
        </p>
      </div>
    </form>
  );
};
