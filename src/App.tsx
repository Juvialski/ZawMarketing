import { useState, useEffect, useMemo } from 'react';
import { AppShell } from './components/layout/AppShell';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { CampaignLibrary } from './components/campaigns/CampaignLibrary';
import { CampaignWorkspace } from './components/campaigns/CampaignWorkspace';
import { SourceIntakeForm } from './components/campaigns/SourceIntakeForm';
import { BrandKitManager } from './components/brand/BrandKitManager';
import { LeadFinder } from './components/leads/LeadFinder';
import { SettingsView } from './components/settings/SettingsView';
import { AuthModal } from './components/auth/AuthModal';
import { PresentationRenderer } from './features/presentations/renderer/PresentationRenderer';
import { generateDeterministicPresentationDeck } from './features/presentations/services/demoDeckGenerator';
import { SAMPLE_CAMPAIGNS } from './data/sampleCampaigns';
import { Presentation, AlertTriangle } from 'lucide-react';

import { Campaign, CampaignSourceData } from './types/campaign';
import { BrandKit } from './types/brandKit';
import { CampaignStore } from './services/storage/campaignStore';
import { BrandKitStore, createNeutralBrandKit } from './services/storage/brandKitStore';
import { AuthService, AppProfile } from './services/supabase/authService';
import { OrganizationService, AppOrganization } from './services/supabase/organizationService';
import { CampaignService } from './services/supabase/campaignService';
import { BrandKitService } from './services/supabase/brandKitService';
import { isSupabaseConfigured } from './services/supabase/client';
import { ServiceError } from './services/supabase/serviceError';

export function App() {
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [brandKit, setBrandKit] = useState<BrandKit>(() => createNeutralBrandKit());
  const [hasPersistedBrandKit, setHasPersistedBrandKit] = useState(false);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [organization, setOrganization] = useState<AppOrganization | null>(null);
  const [runtimeMode, setRuntimeMode] = useState<'demo' | 'live'>(() => (isSupabaseConfigured() ? 'live' : 'demo'));
  const [dataError, setDataError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Presenter mode parameters
  const { isPresenterMode, presenterCampaignId } = useMemo(() => {
    if (typeof window === 'undefined') return { isPresenterMode: false, presenterCampaignId: null };
    const params = new URLSearchParams(window.location.search);
    const presenter = params.get('presenter') === '1' || params.has('presenter');
    const campaignId = params.get('campaign');
    return { isPresenterMode: presenter, presenterCampaignId: campaignId };
  }, []);

  const loadData = async () => {
    const live = isSupabaseConfigured();
    setRuntimeMode(live ? 'live' : 'demo');
    setDataError(null);

    try {
      const user = await AuthService.getUser();
      if (!user && live) {
        // Configured but unauthenticated is a real live state, not demo mode.
        setProfile(null);
        setOrganization(null);
        setCampaigns([]);
        setBrandKit(createNeutralBrandKit());
        setHasPersistedBrandKit(false);
        return;
      }

      if (user) {
        const userProfile = await AuthService.getProfile(user.id);
        const org = await OrganizationService.getDefaultOrganization(user.id);
        if (!org) {
          throw new ServiceError('forbidden', 'Your account is not a member of an organization.');
        }

        const [loadedCampaigns, loadedBrandKit] = await Promise.all([
          CampaignService.getCampaigns(org.id),
          BrandKitService.getBrandKit(org.id),
        ]);

        setProfile(userProfile);
        setOrganization(org);
        setCampaigns(loadedCampaigns);
        setBrandKit(loadedBrandKit || createNeutralBrandKit());
        setHasPersistedBrandKit(Boolean(loadedBrandKit));
        return;
      }

      // No Supabase configuration is an explicit demo fixture mode. Fixture
      // values never enter the authenticated/live branch above.
      setProfile(null);
      setOrganization(null);
      setCampaigns(CampaignStore.getAll({ allowDemoFixtures: true }));
      setBrandKit(BrandKitStore.get({ allowDemoFixtures: true }));
      setHasPersistedBrandKit(false);
    } catch (error: unknown) {
      console.warn('Data load failed', error);
      setProfile(null);
      setOrganization(null);
      if (live) {
        // Preserve the distinction between a live error and an empty/demo
        // workspace. Do not replace an authenticated error with samples.
        setCampaigns([]);
        setBrandKit(createNeutralBrandKit());
        setHasPersistedBrandKit(false);
        setDataError(error instanceof Error ? error.message : 'Live workspace data could not be loaded.');
      } else {
        setCampaigns(CampaignStore.getAll({ allowDemoFixtures: true }));
        setBrandKit(BrandKitStore.get({ allowDemoFixtures: true }));
      }
    }
  };

  useEffect(() => {
    void loadData();

    const { data: authListener } = AuthService.onAuthStateChange(() => {
      void loadData();
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleSelectCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setActiveView('workspace');
  };

  const handleUpdateCampaign = async (updated: Campaign) => {
    try {
      const saved = runtimeMode === 'live'
        ? organization
          ? await CampaignService.updateCampaign(organization.id, updated, profile?.id)
          : (() => { throw new ServiceError('forbidden', 'Sign in to update a live campaign.'); })()
        : await CampaignService.updateCampaign('', updated, profile?.id);
      setSelectedCampaign(saved);
      setCampaigns((previous) => previous.map((campaign) => campaign.id === saved.id ? saved : campaign));
      setDataError(null);
    } catch (error: unknown) {
      setDataError(error instanceof Error ? error.message : 'Campaign update failed.');
    }
  };

  const handleCreateNewCampaign = async (sourceData: CampaignSourceData) => {
    const draft: Campaign = {
      // Live creation ignores this placeholder and uses the server-generated
      // UUID. Demo creation replaces it with an explicitly labeled local ID.
      id: '',
      name: sourceData.title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      sourceData,
      designConfigs: CampaignStore.createDefaultDesignConfigs(),
      tags: [sourceData.campaignType],
    };

    try {
      const saved = runtimeMode === 'live'
        ? organization
          ? await CampaignService.createCampaign(organization.id, draft, profile?.id)
          : (() => { throw new ServiceError('forbidden', 'Sign in to create a live campaign.'); })()
        : await CampaignService.createCampaign('', draft, profile?.id);
      setCampaigns((previous) => [saved, ...previous]);
      setSelectedCampaign(saved);
      setActiveView('workspace');
      setDataError(null);
    } catch (error: unknown) {
      setDataError(error instanceof Error ? error.message : 'Campaign creation failed.');
    }
  };

  const handleDuplicateCampaign = async (id: string) => {
    try {
      const duplicated = await CampaignService.duplicateCampaign(id, runtimeMode === 'live' ? organization?.id || '' : '', profile?.id);
      if (duplicated) setCampaigns((previous) => [duplicated, ...previous]);
      else setDataError('Campaign was not found.');
    } catch (error: unknown) {
      setDataError(error instanceof Error ? error.message : 'Campaign duplication failed.');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      await CampaignService.deleteCampaign(id, runtimeMode === 'live' ? organization?.id : undefined);
      setCampaigns((previous) => previous.filter((campaign) => campaign.id !== id));
      if (selectedCampaign?.id === id) {
        setSelectedCampaign(null);
        setActiveView('campaigns');
      }
      setDataError(null);
    } catch (error: unknown) {
      setDataError(error instanceof Error ? error.message : 'Campaign deletion failed.');
    }
  };

  const handleSaveBrandKit = async (updated: BrandKit) => {
    try {
      const saved = runtimeMode === 'live'
        ? organization
          ? hasPersistedBrandKit
            ? await BrandKitService.updateBrandKit(organization.id, updated)
            : await BrandKitService.createBrandKit(organization.id, updated)
          : (() => { throw new ServiceError('forbidden', 'Sign in to save a live brand kit.'); })()
        : await BrandKitService.saveBrandKit('', updated);
      setBrandKit(saved);
      setHasPersistedBrandKit(true);
      setDataError(null);
    } catch (error: unknown) {
      setDataError(error instanceof Error ? error.message : 'Brand kit save failed.');
    }
  };

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
    } finally {
      setProfile(null);
      setOrganization(null);
      setSelectedCampaign(null);
      void loadData();
    }
  };

  // -------------------------------------------------------------
  // PRESENTER MODE STANDALONE ENTRY (Issue 6)
  // -------------------------------------------------------------
  if (isPresenterMode && presenterCampaignId) {
    // Resolve presenter campaign
    let presenterCampaign = campaigns.find((c) => c.id === presenterCampaignId);

    if (!presenterCampaign && runtimeMode === 'demo') {
      presenterCampaign =
        CampaignStore.getById(presenterCampaignId, { allowDemoFixtures: true }) ||
        SAMPLE_CAMPAIGNS.find((c) => c.id === presenterCampaignId);
    }

    if (!presenterCampaign) {
      return (
        <div className="w-screen h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-red-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-serif font-bold text-slate-100">Campaign Not Found or Access Restricted</h1>
          <p className="text-sm text-slate-400 max-w-md">
            Could not resolve campaign "{presenterCampaignId}". {runtimeMode === 'live' ? 'Ensure you are signed in to an organization with access to this campaign.' : 'Please verify the demo campaign ID.'}
          </p>
          {runtimeMode === 'live' && !profile && (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 transition-colors"
            >
              Sign In to Access Campaign
            </button>
          )}
          <a
            href={window.location.pathname}
            className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors"
          >
            Return to Dashboard
          </a>
          <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={() => { void loadData(); setIsAuthModalOpen(false); }} />
        </div>
      );
    }

    const isDemoCampaign = runtimeMode === 'demo' || presenterCampaign.tags?.includes('Demo') || presenterCampaign.tags?.includes('Fictional');
    const presenterDeck = presenterCampaign.presentation || (isDemoCampaign ? generateDeterministicPresentationDeck(presenterCampaign, brandKit) : null);

    if (!presenterDeck) {
      return (
        <div className="w-screen h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-amber-400">
            <Presentation className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-serif font-bold text-slate-100">Presentation Deck Not Found</h1>
          <p className="text-sm text-slate-400 max-w-md">
            The campaign "{presenterCampaign.name}" does not have an active presentation deck. Please open the Campaign Studio to generate one.
          </p>
          <a
            href={window.location.pathname}
            className="px-4 py-2 bg-white text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      );
    }

    return (
      <div className="w-screen h-screen bg-slate-950 overflow-hidden flex flex-col">
        <PresentationRenderer
          deck={presenterDeck}
          campaign={presenterCampaign}
          brandKit={brandKit}
          onNotesChange={(slideIndex, notes) => {
            if (presenterCampaign && presenterDeck) {
              const updatedSlides = [...presenterDeck.slides];
              if (updatedSlides[slideIndex]) {
                updatedSlides[slideIndex] = {
                  ...updatedSlides[slideIndex],
                  speakerNotes: notes,
                };
                const updatedDeck = { ...presenterDeck, slides: updatedSlides };
                void handleUpdateCampaign({ ...presenterCampaign, presentation: updatedDeck });
              }
            }
          }}
        />
      </div>
    );
  }

  return (
    <AppShell
      activeView={activeView}
      onNavigate={(view) => {
        if (view !== 'workspace') setSelectedCampaign(null);
        setActiveView(view);
      }}
      brandKit={brandKit}
      profile={profile}
      organization={organization}
      onOpenAuth={() => setIsAuthModalOpen(true)}
      onSignOut={() => void handleSignOut()}
    >
      <div className={`mb-5 px-4 py-3 rounded-xl border text-xs ${runtimeMode === 'live' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
        <span className="font-mono font-bold uppercase tracking-wider">{runtimeMode === 'live' ? 'Live workspace' : 'Demo fixture workspace'}</span>
        <span className="ml-2">{runtimeMode === 'live' ? 'Data and AI operations require an authenticated organization.' : 'Fictional campaigns are local fixtures and are never used as live data.'}</span>
      </div>

      {dataError && (
        <div className="mb-5 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs" role="alert">
          {dataError}
        </div>
      )}

      {activeView === 'dashboard' && (
        <DashboardOverview campaigns={campaigns} brandKit={brandKit} onSelectCampaign={handleSelectCampaign} onNewCampaign={() => setActiveView('new_campaign')} onNavigate={(view) => setActiveView(view)} />
      )}

      {activeView === 'campaigns' && (
        <CampaignLibrary
          campaigns={campaigns}
          brandKit={brandKit}
          onSelectCampaign={handleSelectCampaign}
          onNewCampaign={() => setActiveView('new_campaign')}
          onDuplicateCampaign={(id) => void handleDuplicateCampaign(id)}
          onDeleteCampaign={(id) => void handleDeleteCampaign(id)}
          onResetSamples={() => {
            if (runtimeMode === 'demo') {
              CampaignStore.resetToSamples();
              void loadData();
            } else {
              setDataError('Demo fixtures cannot be loaded into a live workspace.');
            }
          }}
        />
      )}

      {activeView === 'new_campaign' && (
        <SourceIntakeForm
          organizationId={runtimeMode === 'live' ? organization?.id : undefined}
          campaignId={runtimeMode === 'live' ? 'drafts' : undefined}
          runtimeMode={runtimeMode}
          onSave={(sourceData) => void handleCreateNewCampaign(sourceData)}
          onCancel={() => setActiveView('campaigns')}
        />
      )}

      {activeView === 'workspace' && selectedCampaign && (
        <CampaignWorkspace
          campaign={selectedCampaign}
          brandKit={brandKit}
          organizationId={organization?.id}
          runtimeMode={runtimeMode}
          onUpdateCampaign={(campaign) => void handleUpdateCampaign(campaign)}
          onBack={() => setActiveView('campaigns')}
        />
      )}

      {activeView === 'brand' && <BrandKitManager brandKit={brandKit} onSaveBrandKit={(kit) => void handleSaveBrandKit(kit)} />}
      {activeView === 'leads' && <LeadFinder />}
      {activeView === 'settings' && <SettingsView organizationId={organization?.id} />}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={() => { void loadData(); setIsAuthModalOpen(false); }} />
    </AppShell>
  );
}

export default App;
