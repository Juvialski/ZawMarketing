import { useState, useEffect } from 'react';
import { Campaign, CampaignSourceData } from './types/campaign';
import { BrandKit } from './types/brandKit';
import { CampaignStore } from './services/storage/campaignStore';
import { BrandKitStore } from './services/storage/brandKitStore';
import { AppShell } from './components/layout/AppShell';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { CampaignLibrary } from './components/campaigns/CampaignLibrary';
import { CampaignWorkspace } from './components/campaigns/CampaignWorkspace';
import { SourceIntakeForm } from './components/campaigns/SourceIntakeForm';
import { BrandKitManager } from './components/brand/BrandKitManager';
import { LeadFinder } from './components/leads/LeadFinder';
import { SettingsView } from './components/settings/SettingsView';

export function App() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [brandKit, setBrandKit] = useState<BrandKit>(BrandKitStore.get());
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  useEffect(() => {
    setCampaigns(CampaignStore.getAll());
    setBrandKit(BrandKitStore.get());
  }, []);

  const handleSelectCampaign = (campaign: Campaign) => {
    setSelectedCampaignId(campaign.id);
    setActiveView('workspace');
  };

  const handleCreateNewCampaign = (sourceData: CampaignSourceData) => {
    const newCampaign: Campaign = {
      id: `campaign-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: sourceData.title,
      status: 'draft',
      sourceData,
      designConfigs: CampaignStore.createDefaultDesignConfigs(),
      tags: [sourceData.campaignType.replace(/_/g, ' ')],
    };

    const saved = CampaignStore.save(newCampaign);
    setCampaigns(CampaignStore.getAll());
    setSelectedCampaignId(saved.id);
    setActiveView('workspace');
  };

  const handleUpdateCampaign = (updated: Campaign) => {
    CampaignStore.save(updated);
    setCampaigns(CampaignStore.getAll());
  };

  const handleDuplicateCampaign = (id: string) => {
    const duplicated = CampaignStore.duplicate(id);
    if (duplicated) {
      setCampaigns(CampaignStore.getAll());
      setSelectedCampaignId(duplicated.id);
      setActiveView('workspace');
    }
  };

  const handleDeleteCampaign = (id: string) => {
    CampaignStore.delete(id);
    setCampaigns(CampaignStore.getAll());
    if (selectedCampaignId === id) {
      setSelectedCampaignId(null);
      setActiveView('campaigns');
    }
  };

  const handleResetSamples = () => {
    const samples = CampaignStore.resetToSamples();
    setCampaigns(samples);
  };

  const handleSaveBrandKit = (updatedBrandKit: BrandKit) => {
    BrandKitStore.save(updatedBrandKit);
    setBrandKit(updatedBrandKit);
  };

  const activeCampaign = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];

  return (
    <AppShell
      activeView={activeView}
      onNavigate={(view) => {
        setActiveView(view);
      }}
      brandKit={brandKit}
    >
      {activeView === 'dashboard' && (
        <DashboardOverview
          campaigns={campaigns}
          brandKit={brandKit}
          onSelectCampaign={handleSelectCampaign}
          onNewCampaign={() => setActiveView('new_campaign')}
          onNavigate={(view) => setActiveView(view)}
        />
      )}

      {activeView === 'campaigns' && (
        <CampaignLibrary
          campaigns={campaigns}
          brandKit={brandKit}
          onSelectCampaign={handleSelectCampaign}
          onNewCampaign={() => setActiveView('new_campaign')}
          onDuplicateCampaign={handleDuplicateCampaign}
          onDeleteCampaign={handleDeleteCampaign}
          onResetSamples={handleResetSamples}
        />
      )}

      {activeView === 'new_campaign' && (
        <SourceIntakeForm
          onSave={handleCreateNewCampaign}
          onCancel={() => setActiveView('campaigns')}
        />
      )}

      {activeView === 'workspace' && activeCampaign && (
        <CampaignWorkspace
          campaign={activeCampaign}
          brandKit={brandKit}
          onUpdateCampaign={handleUpdateCampaign}
          onBack={() => setActiveView('campaigns')}
        />
      )}

      {activeView === 'brand' && (
        <BrandKitManager
          brandKit={brandKit}
          onSaveBrandKit={handleSaveBrandKit}
        />
      )}

      {activeView === 'leads' && <LeadFinder />}

      {activeView === 'settings' && <SettingsView />}
    </AppShell>
  );
}

export default App;
