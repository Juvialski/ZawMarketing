import { useState, useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { CampaignLibrary } from './components/campaigns/CampaignLibrary';
import { CampaignWorkspace } from './components/campaigns/CampaignWorkspace';
import { SourceIntakeForm } from './components/campaigns/SourceIntakeForm';
import { BrandKitManager } from './components/brand/BrandKitManager';
import { LeadFinder } from './components/leads/LeadFinder';
import { SettingsView } from './components/settings/SettingsView';
import { AuthModal } from './components/auth/AuthModal';

import { Campaign, CampaignSourceData } from './types/campaign';
import { BrandKit, DEFAULT_BRAND_KIT } from './types/brandKit';
import { CampaignStore } from './services/storage/campaignStore';
import { AuthService, AppProfile } from './services/supabase/authService';
import { OrganizationService, AppOrganization } from './services/supabase/organizationService';
import { CampaignService } from './services/supabase/campaignService';
import { BrandKitService } from './services/supabase/brandKitService';

export function App() {
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [brandKit, setBrandKit] = useState<BrandKit>(DEFAULT_BRAND_KIT);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [organization, setOrganization] = useState<AppOrganization | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Initialize Auth & Data Layer
  const loadData = async () => {
    try {
      const user = await AuthService.getUser();
      if (user) {
        const userProfile = await AuthService.getProfile(user.id);
        setProfile(userProfile);
        const org = await OrganizationService.getDefaultOrganization(user.id);
        setOrganization(org);

        const [loadedCampaigns, loadedBrandKit] = await Promise.all([
          CampaignService.getCampaigns(org.id),
          BrandKitService.getBrandKit(org.id),
        ]);

        setCampaigns(loadedCampaigns);
        setBrandKit(loadedBrandKit);
      } else {
        setCampaigns(CampaignStore.getAll());
        setBrandKit(DEFAULT_BRAND_KIT);
      }
    } catch (e) {
      console.warn('Data load error, falling back to local store', e);
      setCampaigns(CampaignStore.getAll());
      setBrandKit(DEFAULT_BRAND_KIT);
    }
  };

  useEffect(() => {
    loadData();

    const { data: authListener } = AuthService.onAuthStateChange(() => {
      loadData();
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleSelectCampaign = (c: Campaign) => {
    setSelectedCampaign(c);
    setActiveView('workspace');
  };

  const handleUpdateCampaign = async (updated: Campaign) => {
    const orgId = organization?.id || 'a0000000-0000-0000-0000-000000000001';
    const saved = await CampaignService.saveCampaign(orgId, updated, profile?.id);
    setSelectedCampaign(saved);
    setCampaigns((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
  };

  const handleCreateNewCampaign = (sourceData: CampaignSourceData) => {
    const orgId = organization?.id || 'a0000000-0000-0000-0000-000000000001';
    const newCamp: Campaign = {
      id: `camp-${Date.now()}`,
      name: sourceData.title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      sourceData,
      designConfigs: CampaignStore.createDefaultDesignConfigs(),
      tags: [sourceData.campaignType],
    };

    CampaignService.saveCampaign(orgId, newCamp, profile?.id).then((saved) => {
      setCampaigns((prev) => [saved, ...prev]);
      setSelectedCampaign(saved);
      setActiveView('workspace');
    });
  };

  const handleDuplicateCampaign = async (id: string) => {
    const orgId = organization?.id || 'a0000000-0000-0000-0000-000000000001';
    const duplicated = await CampaignService.duplicateCampaign(id, orgId, profile?.id);
    if (duplicated) {
      setCampaigns((prev) => [duplicated, ...prev]);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    await CampaignService.deleteCampaign(id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    if (selectedCampaign?.id === id) {
      setSelectedCampaign(null);
      setActiveView('campaigns');
    }
  };

  const handleSaveBrandKit = async (updated: BrandKit) => {
    const orgId = organization?.id || 'a0000000-0000-0000-0000-000000000001';
    const saved = await BrandKitService.saveBrandKit(orgId, updated);
    setBrandKit(saved);
  };

  const handleSignOut = async () => {
    await AuthService.signOut();
    setProfile(null);
    setOrganization(null);
    loadData();
  };

  return (
    <AppShell
      activeView={activeView}
      onNavigate={(v) => {
        if (v !== 'workspace') setSelectedCampaign(null);
        setActiveView(v);
      }}
      brandKit={brandKit}
      profile={profile}
      organization={organization}
      onOpenAuth={() => setIsAuthModalOpen(true)}
      onSignOut={handleSignOut}
    >
      {/* 1. Dashboard */}
      {activeView === 'dashboard' && (
        <DashboardOverview
          campaigns={campaigns}
          brandKit={brandKit}
          onSelectCampaign={handleSelectCampaign}
          onNewCampaign={() => setActiveView('new_campaign')}
          onNavigate={(v) => setActiveView(v)}
        />
      )}

      {/* 2. Campaign Library */}
      {activeView === 'campaigns' && (
        <CampaignLibrary
          campaigns={campaigns}
          brandKit={brandKit}
          onSelectCampaign={handleSelectCampaign}
          onNewCampaign={() => setActiveView('new_campaign')}
          onDuplicateCampaign={handleDuplicateCampaign}
          onDeleteCampaign={handleDeleteCampaign}
          onResetSamples={() => {
            CampaignStore.resetToSamples();
            loadData();
          }}
        />
      )}

      {/* 3. New Campaign Intake */}
      {activeView === 'new_campaign' && (
        <SourceIntakeForm
          onSave={handleCreateNewCampaign}
          onCancel={() => setActiveView('campaigns')}
        />
      )}

      {/* 4. Active Campaign Studio Workspace */}
      {activeView === 'workspace' && selectedCampaign && (
        <CampaignWorkspace
          campaign={selectedCampaign}
          brandKit={brandKit}
          onUpdateCampaign={handleUpdateCampaign}
          onBack={() => setActiveView('campaigns')}
        />
      )}

      {/* 5. Brand Kit Manager */}
      {activeView === 'brand' && (
        <BrandKitManager
          brandKit={brandKit}
          onSaveBrandKit={handleSaveBrandKit}
        />
      )}

      {/* 6. Lead Finder */}
      {activeView === 'leads' && <LeadFinder />}

      {/* 7. Provider Settings */}
      {activeView === 'settings' && <SettingsView />}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={() => {
          loadData();
          setIsAuthModalOpen(false);
        }}
      />
    </AppShell>
  );
}

export default App;
