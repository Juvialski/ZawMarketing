import React, { useState, useRef } from 'react';
import { Campaign } from '../../../types/campaign';
import { BrandKit } from '../../../types/brandKit';
import { PresentationDeck } from '../../../types/presentation';
import { PresentationRenderer } from '../renderer/PresentationRenderer';
import { SlideEditorModal } from './SlideEditorModal';
import { generateDeterministicPresentationDeck } from '../services/demoDeckGenerator';
import { validatePresentationDeck } from '../utils/validatePresentationDeck';
import { ProviderManager } from '../../../services/providers/aiProvider';
import {
  Play,
  Edit3,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  RefreshCw,
  FileJson,
} from 'lucide-react';

interface PresentationWorkspaceProps {
  campaign: Campaign;
  brandKit: BrandKit;
  organizationId?: string;
  runtimeMode: 'demo' | 'live';
  onUpdateCampaign: (campaign: Campaign) => void;
}

export const PresentationWorkspace: React.FC<PresentationWorkspaceProps> = ({
  campaign,
  brandKit,
  organizationId,
  runtimeMode,
  onUpdateCampaign,
}) => {
  const [deck, setDeck] = useState<PresentationDeck>(() => {
    return campaign.presentation || generateDeterministicPresentationDeck(campaign, brandKit);
  });
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  const qaReport = validatePresentationDeck(deck);

  const handleSaveDeck = (updatedDeck: PresentationDeck) => {
    setDeck(updatedDeck);
    const updatedCampaign: Campaign = {
      ...campaign,
      presentation: updatedDeck,
    };
    onUpdateCampaign(updatedCampaign);
  };

  const handleNotesChange = (slideIndex: number, notes: string) => {
    const updatedSlides = [...deck.slides];
    if (updatedSlides[slideIndex]) {
      updatedSlides[slideIndex] = {
        ...updatedSlides[slideIndex],
        speakerNotes: notes,
      };
      const updatedDeck = { ...deck, slides: updatedSlides };
      setDeck(updatedDeck);
      onUpdateCampaign({ ...campaign, presentation: updatedDeck });
    }
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    setGenerationStep('Initializing presentation engine...');
    try {
      const ai = ProviderManager.getAIProvider();
      if (runtimeMode === 'demo' || !ai.isConfigured()) {
        const demoDeck = generateDeterministicPresentationDeck(campaign, brandKit);
        handleSaveDeck(demoDeck);
      } else {
        const newDeck = await ai.generatePresentationDeck(
          campaign,
          brandKit,
          (step: string) => setGenerationStep(step),
          { organizationId, campaignId: campaign.id, runtimeMode }
        );
        handleSaveDeck(newDeck);
      }
    } catch (err) {
      console.warn('AI deck generation error, using deterministic generator', err);
      const fallbackDeck = generateDeterministicPresentationDeck(campaign, brandKit);
      handleSaveDeck(fallbackDeck);
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(deck, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${campaign.id}-presentation-deck.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      } else {
        containerRef.current.requestFullscreen?.();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              Bolt Slides Presentation Engine
            </span>
            <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              {deck.slides.filter((s) => !s.isHidden).length} Slides
            </span>
          </div>
          <h2 className="text-lg font-serif font-bold text-slate-900 mt-1">
            Investment Presentation & Deck Studio
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsEditorOpen(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Slides</span>
          </button>

          <button
            onClick={handleExportJson}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            title="Export Presentation Deck JSON"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {isGenerating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isGenerating ? generationStep || 'Generating...' : 'Regenerate Deck'}</span>
          </button>

          <button
            onClick={handleFullscreen}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Present Fullscreen</span>
          </button>
        </div>
      </div>

      {/* 2. QA Preflight Check Summary */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {qaReport.valid ? (
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Preflight Quality Check: Passed ({qaReport.checks.length} checks verified)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-700 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Preflight Warnings: {qaReport.errors.join(' · ')}</span>
            </div>
          )}
        </div>

        <div className="text-slate-500 font-mono text-[11px]">
          Shortcuts: [←/→] Navigate · [S] Sidebar · [G] Grid · [A] Annotate · [P] Presenter · [F] Fullscreen
        </div>
      </div>

      {/* 3. Presentation Viewport Frame */}
      <div
        ref={containerRef}
        className="w-full aspect-[16/9] min-h-[500px] max-h-[780px] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative"
      >
        <PresentationRenderer
          deck={deck}
          campaign={campaign}
          brandKit={brandKit}
          onNotesChange={handleNotesChange}
        />
      </div>

      {/* 4. Slide Editor Modal */}
      {isEditorOpen && (
        <SlideEditorModal
          deck={deck}
          onSave={handleSaveDeck}
          onClose={() => setIsEditorOpen(false)}
        />
      )}
    </div>
  );
};
