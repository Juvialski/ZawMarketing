import React, { useEffect, useState } from 'react';
import { SanitizedGraphicMaterial, SanitizedGraphicVariant, ReviewStatus } from '../../types/review';
import { BrandKit } from '../../types/brandKit';
import { Campaign } from '../../types/campaign';
import { DesignRenderer } from '../designs/DesignRenderer';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  Check, 
  Star, 
  AlertCircle, 
  Columns
} from 'lucide-react';

interface MaterialLightboxModalProps {
  isOpen: boolean;
  material: SanitizedGraphicMaterial;
  activeVariant: SanitizedGraphicVariant;
  allMaterials: SanitizedGraphicMaterial[];
  brandKit: BrandKit;
  campaign: Campaign;
  currentStatus: ReviewStatus;
  isPreferred: boolean;
  allowSelection: boolean;
  allowApproval: boolean;
  allowComments: boolean;
  onSelectVariant: (variantId: string) => void;
  onMarkPreferred: (materialKey: string, variantKey: string) => void;
  onUpdateStatus: (materialKey: string, variantKey: string, status: ReviewStatus, comment?: string) => void;
  onOpenComparison: (material: SanitizedGraphicMaterial) => void;
  onNavigateMaterial: (material: SanitizedGraphicMaterial) => void;
  onClose: () => void;
}

export const MaterialLightboxModal: React.FC<MaterialLightboxModalProps> = ({
  isOpen,
  material,
  activeVariant,
  allMaterials,
  brandKit,
  campaign,
  currentStatus,
  isPreferred,
  allowSelection,
  allowApproval,
  allowComments,
  onSelectVariant,
  onMarkPreferred,
  onUpdateStatus,
  onOpenComparison,
  onNavigateMaterial,
  onClose,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNextMaterial();
      if (e.key === 'ArrowLeft') handlePrevMaterial();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, material]);

  if (!isOpen) return null;

  const currentIndex = allMaterials.findIndex((m) => m.id === material.id);
  const handlePrevMaterial = () => {
    if (currentIndex > 0) onNavigateMaterial(allMaterials[currentIndex - 1]);
  };
  const handleNextMaterial = () => {
    if (currentIndex < allMaterials.length - 1) onNavigateMaterial(allMaterials[currentIndex + 1]);
  };

  const handleSaveComment = () => {
    if (commentText.trim()) {
      onUpdateStatus(material.id, activeVariant.id, 'needs_changes', commentText.trim());
      setIsCommenting(false);
      setCommentText('');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col text-slate-100 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={`${material.label} Lightbox View`}
    >
      {/* Top Bar */}
      <div className="h-16 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono uppercase tracking-wider bg-slate-800 text-amber-400 px-2.5 py-1 rounded font-bold">
            {material.category.toUpperCase()}
          </span>
          <div>
            <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
              {material.label}
              <span className="text-xs font-sans font-normal text-slate-400">
                · {activeVariant.name}
              </span>
            </h3>
            <div className="text-[11px] font-mono text-slate-400">
              {material.dimensions.width} × {material.dimensions.height} px ({material.sublabel})
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {material.variants.length > 1 && (
            <button
              onClick={() => onOpenComparison(material)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Columns className="w-3.5 h-3.5 text-amber-400" />
              <span>Compare {material.variants.length} Versions</span>
            </button>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            title={isFullscreen ? 'Fit to screen' : 'Full view'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-400 rounded-lg transition-colors"
            aria-label="Close lightbox"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative flex items-center justify-center p-4 sm:p-8">
        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrevMaterial}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-full shadow-lg transition-all z-10"
            aria-label="Previous material"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {currentIndex < allMaterials.length - 1 && (
          <button
            onClick={handleNextMaterial}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-full shadow-lg transition-all z-10"
            aria-label="Next material"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Scaled Preview Canvas */}
        <div className={`transition-all duration-300 flex items-center justify-center ${isFullscreen ? 'w-full h-full' : 'max-w-[75vw] max-h-[75vh]'}`}>
          <div className="w-full h-full flex items-center justify-center">
            <div className="max-w-[850px] w-full shadow-2xl rounded-xl overflow-hidden border border-slate-800">
              <DesignRenderer
                campaign={campaign}
                aspectRatio={material.format}
                configOverride={activeVariant.config}
                brandKit={brandKit}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Variant Switcher & Feedback Actions */}
      <div className="border-t border-slate-800 bg-slate-900/90 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
        {/* Variant Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-xs font-mono text-slate-400 mr-1">Variant:</span>
          {material.variants.map((v) => {
            const isSelected = v.id === activeVariant.id;
            return (
              <button
                key={v.id}
                onClick={() => onSelectVariant(v.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{v.name}</span>
                {isPreferred && isSelected && (
                  <Star className="w-3 h-3 fill-slate-950 text-slate-950" />
                )}
              </button>
            );
          })}
        </div>

        {/* Reviewer Action Buttons */}
        <div className="flex items-center gap-3">
          {allowSelection && (
            <button
              onClick={() => onMarkPreferred(material.id, activeVariant.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                isPreferred
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isPreferred ? 'fill-slate-950 text-slate-950' : 'text-amber-400'}`} />
              <span>{isPreferred ? '✓ Preferred Version' : 'Mark as Preferred'}</span>
            </button>
          )}

          {allowApproval && (
            <>
              <button
                onClick={() => onUpdateStatus(material.id, activeVariant.id, 'approved')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  currentStatus === 'approved'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 hover:bg-emerald-900/50 text-slate-200 border border-slate-700'
                }`}
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentStatus === 'approved' ? 'Approved' : 'Approve'}</span>
              </button>

              <button
                onClick={() => setIsCommenting(!isCommenting)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  currentStatus === 'needs_changes'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800 hover:bg-amber-900/50 text-slate-200 border border-slate-700'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Needs Changes</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Inline Comment Panel */}
      {isCommenting && allowComments && (
        <div className="bg-slate-900 border-t border-slate-800 p-4 flex items-center gap-3">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={`Notes on ${activeVariant.name} (e.g. "Headline should emphasize the $70k spread")...`}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            autoFocus
          />
          <button
            onClick={handleSaveComment}
            disabled={!commentText.trim()}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold transition-colors"
          >
            Submit Note
          </button>
          <button
            onClick={() => setIsCommenting(false)}
            className="px-3 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
