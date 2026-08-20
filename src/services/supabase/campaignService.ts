import { supabase, isSupabaseConfigured } from './client';
import { Campaign, CampaignCopy, CampaignSourceData, CampaignStrategy, GraphicDesignConfig, OutputAspectRatio } from '../../types/campaign';
import { CampaignStore } from '../storage/campaignStore';

export class CampaignService {
  public static async getCampaigns(organizationId: string): Promise<Campaign[]> {
    if (!isSupabaseConfigured()) {
      return CampaignStore.getAll();
    }

    const { data, error } = await (supabase as any)
      .from('campaigns')
      .select('*, campaign_content(*)')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return CampaignStore.getAll();
    }

    return data.map((row: any) => this.mapRowToCampaign(row));
  }

  public static async getCampaignById(id: string): Promise<Campaign | null> {
    if (!isSupabaseConfigured()) {
      return CampaignStore.getById(id) || null;
    }

    const { data, error } = await (supabase as any)
      .from('campaigns')
      .select('*, campaign_content(*)')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return CampaignStore.getById(id) || null;
    }

    return this.mapRowToCampaign(data);
  }

  public static async saveCampaign(
    organizationId: string,
    campaign: Campaign,
    userId?: string
  ): Promise<Campaign> {
    // Keep local cache updated
    CampaignStore.save(campaign);

    if (!isSupabaseConfigured()) {
      return campaign;
    }

    const payload = {
      organization_id: organizationId,
      created_by: userId || null,
      name: campaign.name,
      campaign_type: campaign.sourceData.campaignType,
      target_market: campaign.sourceData.targetMarket,
      status: campaign.status,
      source_data: campaign.sourceData as any,
      strategy: (campaign.strategy as any) || null,
      design_configs: campaign.designConfigs as any,
      tags: campaign.tags || [],
      updated_at: new Date().toISOString(),
    };

    const isExisting = Boolean(campaign.id && !campaign.id.startsWith('camp-sample-'));

    if (isExisting) {
      await (supabase as any).from('campaigns').update(payload).eq('id', campaign.id);
    } else {
      const { data } = await (supabase as any).from('campaigns').insert(payload).select('id').single();
      if (data) {
        campaign.id = data.id;
      }
    }

    // Persist content revision if copy is present
    if (campaign.copy && campaign.id) {
      await (supabase as any).from('campaign_content').upsert({
        campaign_id: campaign.id,
        organization_id: organizationId,
        content_type: 'all_package',
        content: campaign.copy as any,
        quality_report: (campaign.copy.qualityReport as any) || null,
        updated_at: new Date().toISOString(),
      });
    }

    return campaign;
  }

  public static async deleteCampaign(id: string): Promise<void> {
    CampaignStore.delete(id);

    if (isSupabaseConfigured()) {
      await (supabase as any).from('campaigns').delete().eq('id', id);
    }
  }

  public static async duplicateCampaign(
    id: string,
    organizationId: string,
    userId?: string
  ): Promise<Campaign | null> {
    const original = await this.getCampaignById(id);
    if (!original) return null;

    const duplicated: Campaign = {
      ...original,
      id: `camp-${Date.now()}`,
      name: `${original.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.saveCampaign(organizationId, duplicated, userId);
  }

  private static mapRowToCampaign(row: any): Campaign {
    const copyContent = row.campaign_content?.find((c: any) => c.content_type === 'all_package');
    const copy: CampaignCopy | undefined = copyContent?.content as any;

    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      status: row.status,
      sourceData: row.source_data as CampaignSourceData,
      strategy: row.strategy as CampaignStrategy | undefined,
      copy,
      designConfigs: row.design_configs as Record<OutputAspectRatio, GraphicDesignConfig>,
      tags: row.tags || [],
    };
  }
}
