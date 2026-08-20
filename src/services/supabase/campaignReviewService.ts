import { supabase, isSupabaseConfigured } from './client';
import { 
  ReviewLink, 
  ReviewVersion, 
  ReviewFeedback, 
  ReviewLinkPermissions, 
  PublicReviewPortalResponse, 
  ReviewStatus 
} from '../../types/review';
import { Campaign } from '../../types/campaign';
import { BrandKit } from '../../types/brandKit';
import { generateSecureReviewToken, hashReviewToken } from '../review/reviewCrypto';
import { buildReviewSnapshot } from '../review/reviewSnapshotBuilder';
import { CampaignReviewStore } from '../storage/campaignReviewStore';
import { ServiceError } from './serviceError';

const isDemoContext = (organizationId?: string, campaignId?: string): boolean => {
  if (!isSupabaseConfigured()) return true;
  if (!organizationId || organizationId === 'demo-org' || organizationId.startsWith('demo-')) return true;
  if (campaignId && (campaignId.startsWith('campaign-') || campaignId.startsWith('demo-'))) return true;
  return false;
};

export class CampaignReviewService {
  // ---------------- Owner Workspace Methods ----------------

  public static async getReviewLinks(
    organizationId: string,
    campaignId: string
  ): Promise<ReviewLink[]> {
    if (isDemoContext(organizationId, campaignId)) {
      return CampaignReviewStore.getLinksByCampaign(campaignId);
    }

    const { data, error } = await supabase
      .from('campaign_review_links')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ServiceError('write_failed', `Failed to load review links: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      campaignId: row.campaign_id,
      tokenHash: row.token_hash,
      isActive: row.is_active,
      expiresAt: row.expires_at,
      permissions: {
        allowComments: row.allow_comments,
        allowSelection: row.allow_selection,
        allowApproval: row.allow_approval,
        allowDownloads: row.allow_downloads,
      },
      currentVersionNumber: row.current_version_number,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  public static async createReviewLink(
    organizationId: string,
    campaign: Campaign,
    brandKit: BrandKit,
    permissions?: Partial<ReviewLinkPermissions>,
    expiresAt: string | null = null,
    userId?: string
  ): Promise<{ link: ReviewLink; rawToken: string; version: ReviewVersion }> {
    if (isDemoContext(organizationId, campaign.id)) {
      return CampaignReviewStore.createReviewLink(campaign, brandKit, permissions, expiresAt);
    }

    const rawToken = generateSecureReviewToken();
    const tokenHash = await hashReviewToken(rawToken);

    // 1. Deactivate old links for this campaign
    await supabase
      .from('campaign_review_links')
      .update({ is_active: false })
      .eq('organization_id', organizationId)
      .eq('campaign_id', campaign.id);

    // 2. Insert new link
    const { data: linkRow, error: linkError } = await supabase
      .from('campaign_review_links')
      .insert({
        organization_id: organizationId,
        campaign_id: campaign.id,
        token_hash: tokenHash,
        is_active: true,
        expires_at: expiresAt,
        allow_comments: permissions?.allowComments ?? true,
        allow_selection: permissions?.allowSelection ?? true,
        allow_approval: permissions?.allowApproval ?? true,
        allow_downloads: permissions?.allowDownloads ?? false,
        created_by: userId || null,
        current_version_number: 1,
      })
      .select()
      .single();

    if (linkError || !linkRow) {
      throw new ServiceError('write_failed', `Failed to create review link: ${linkError?.message}`);
    }

    // 3. Build & insert version 1 snapshot
    const snapshot = buildReviewSnapshot(campaign, brandKit);
    const { data: versionRow, error: versionError } = await supabase
      .from('campaign_review_versions')
      .insert({
        review_link_id: linkRow.id,
        version_number: 1,
        title: 'Review Package v1',
        published_snapshot: snapshot as any,
      })
      .select()
      .single();

    if (versionError || !versionRow) {
      throw new ServiceError('write_failed', `Failed to publish snapshot: ${versionError?.message}`);
    }

    const link: ReviewLink = {
      id: linkRow.id,
      organizationId: linkRow.organization_id,
      campaignId: linkRow.campaign_id,
      tokenHash: linkRow.token_hash,
      rawToken,
      isActive: linkRow.is_active,
      expiresAt: linkRow.expires_at,
      permissions: {
        allowComments: linkRow.allow_comments,
        allowSelection: linkRow.allow_selection,
        allowApproval: linkRow.allow_approval,
        allowDownloads: linkRow.allow_downloads,
      },
      currentVersionNumber: 1,
      createdAt: linkRow.created_at,
      updatedAt: linkRow.updated_at,
    };

    const version: ReviewVersion = {
      id: versionRow.id,
      reviewLinkId: versionRow.review_link_id,
      versionNumber: versionRow.version_number,
      title: versionRow.title,
      notes: versionRow.notes || undefined,
      publishedAt: versionRow.published_at,
      snapshot: versionRow.published_snapshot as any,
    };

    return { link, rawToken, version };
  }

  public static async publishNewVersion(
    organizationId: string,
    reviewLinkId: string,
    campaign: Campaign,
    brandKit: BrandKit,
    title?: string,
    notes?: string
  ): Promise<ReviewVersion> {
    if (isDemoContext(organizationId, campaign.id)) {
      const res = await CampaignReviewStore.publishNewVersion(reviewLinkId, campaign, brandKit, title, notes);
      if (!res) throw new ServiceError('write_failed', 'Failed to publish new review version in store.');
      return res;
    }

    // 1. Get current link
    const { data: linkRow, error: linkErr } = await supabase
      .from('campaign_review_links')
      .select('*')
      .eq('id', reviewLinkId)
      .eq('organization_id', organizationId)
      .single();

    if (linkErr || !linkRow) {
      throw new ServiceError('write_failed', `Review link not found: ${linkErr?.message}`);
    }

    const nextVersionNum = linkRow.current_version_number + 1;
    const snapshot = buildReviewSnapshot(campaign, brandKit);

    // 2. Insert new version
    const { data: versionRow, error: verErr } = await supabase
      .from('campaign_review_versions')
      .insert({
        review_link_id: reviewLinkId,
        version_number: nextVersionNum,
        title: title || `Review Package v${nextVersionNum}`,
        notes: notes || null,
        published_snapshot: snapshot as any,
      })
      .select()
      .single();

    if (verErr || !versionRow) {
      throw new ServiceError('write_failed', `Failed to publish review version: ${verErr?.message}`);
    }

    // Update link version number
    await supabase
      .from('campaign_review_links')
      .update({
        current_version_number: nextVersionNum,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewLinkId);

    return {
      id: versionRow.id,
      reviewLinkId: versionRow.review_link_id,
      versionNumber: versionRow.version_number,
      title: versionRow.title,
      notes: versionRow.notes || undefined,
      publishedAt: versionRow.published_at,
      snapshot: versionRow.published_snapshot as any,
    };
  }

  public static async rotateReviewLink(
    organizationId: string,
    reviewLinkId: string,
    campaign: Campaign,
    brandKit: BrandKit
  ): Promise<{ link: ReviewLink; rawToken: string }> {
    if (isDemoContext(organizationId, campaign.id)) {
      const res = await CampaignReviewStore.rotateReviewLink(reviewLinkId, campaign, brandKit);
      if (!res) throw new ServiceError('write_failed', 'Failed to rotate review link in store.');
      return res;
    }

    const rawToken = generateSecureReviewToken();
    const tokenHash = await hashReviewToken(rawToken);

    const { data: linkRow, error } = await supabase
      .from('campaign_review_links')
      .update({
        token_hash: tokenHash,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewLinkId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error || !linkRow) {
      throw new ServiceError('write_failed', `Failed to rotate review link: ${error?.message}`);
    }

    return {
      link: {
        id: linkRow.id,
        organizationId: linkRow.organization_id,
        campaignId: linkRow.campaign_id,
        tokenHash: linkRow.token_hash,
        rawToken,
        isActive: linkRow.is_active,
        expiresAt: linkRow.expires_at,
        permissions: {
          allowComments: linkRow.allow_comments,
          allowSelection: linkRow.allow_selection,
          allowApproval: linkRow.allow_approval,
          allowDownloads: linkRow.allow_downloads,
        },
        currentVersionNumber: linkRow.current_version_number,
        createdAt: linkRow.created_at,
        updatedAt: linkRow.updated_at,
      },
      rawToken,
    };
  }

  public static async revokeReviewLink(
    organizationId: string,
    reviewLinkId: string
  ): Promise<boolean> {
    if (isDemoContext(organizationId)) {
      return CampaignReviewStore.revokeReviewLink(reviewLinkId);
    }

    const { error } = await supabase
      .from('campaign_review_links')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewLinkId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new ServiceError('write_failed', `Failed to revoke review link: ${error.message}`);
    }
    return true;
  }

  public static async updatePermissions(
    organizationId: string,
    reviewLinkId: string,
    permissions: ReviewLinkPermissions,
    expiresAt?: string | null
  ): Promise<ReviewLink> {
    if (isDemoContext(organizationId)) {
      const res = CampaignReviewStore.updatePermissions(reviewLinkId, permissions, expiresAt);
      if (!res) throw new ServiceError('write_failed', 'Failed to update permissions in store.');
      return res;
    }

    const updatePayload: any = {
      allow_comments: permissions.allowComments,
      allow_selection: permissions.allowSelection,
      allow_approval: permissions.allowApproval,
      allow_downloads: permissions.allowDownloads,
      updated_at: new Date().toISOString(),
    };
    if (expiresAt !== undefined) updatePayload.expires_at = expiresAt;

    const { data: linkRow, error } = await supabase
      .from('campaign_review_links')
      .update(updatePayload)
      .eq('id', reviewLinkId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error || !linkRow) {
      throw new ServiceError('write_failed', `Failed to update permissions: ${error?.message}`);
    }

    return {
      id: linkRow.id,
      organizationId: linkRow.organization_id,
      campaignId: linkRow.campaign_id,
      tokenHash: linkRow.token_hash,
      isActive: linkRow.is_active,
      expiresAt: linkRow.expires_at,
      permissions: {
        allowComments: linkRow.allow_comments,
        allowSelection: linkRow.allow_selection,
        allowApproval: linkRow.allow_approval,
        allowDownloads: linkRow.allow_downloads,
      },
      currentVersionNumber: linkRow.current_version_number,
      createdAt: linkRow.created_at,
      updatedAt: linkRow.updated_at,
    };
  }

  public static async getVersions(
    organizationId: string,
    reviewLinkId: string
  ): Promise<ReviewVersion[]> {
    if (isDemoContext(organizationId)) {
      return CampaignReviewStore.getVersionsByLinkId(reviewLinkId);
    }

    const { data, error } = await supabase
      .from('campaign_review_versions')
      .select('*')
      .eq('review_link_id', reviewLinkId)
      .order('version_number', { ascending: false });

    if (error) {
      throw new ServiceError('write_failed', `Failed to load review versions: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      reviewLinkId: row.review_link_id,
      versionNumber: row.version_number,
      title: row.title,
      notes: row.notes || undefined,
      publishedAt: row.published_at,
      snapshot: row.published_snapshot as any,
    }));
  }

  public static async getFeedback(
    organizationId: string,
    reviewLinkId: string
  ): Promise<ReviewFeedback[]> {
    if (isDemoContext(organizationId)) {
      return CampaignReviewStore.getFeedbackByLinkId(reviewLinkId);
    }

    const { data, error } = await supabase
      .from('campaign_review_feedback')
      .select('*')
      .eq('review_link_id', reviewLinkId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new ServiceError('write_failed', `Failed to load review feedback: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      reviewLinkId: row.review_link_id,
      reviewVersionId: row.review_version_id || undefined,
      materialKey: row.material_key,
      variantKey: row.variant_key || undefined,
      reviewerName: row.reviewer_name || 'Reviewer',
      status: row.status as ReviewStatus,
      comment: row.comment || undefined,
      updatedAt: row.updated_at,
    }));
  }

  // ---------------- Public Review Portal Methods ----------------

  public static async getPublicSnapshot(
    rawToken: string
  ): Promise<PublicReviewPortalResponse> {
    const tokenHash = await hashReviewToken(rawToken);

    // Check store first for demo/offline links
    const storeLink = await CampaignReviewStore.getLinkByTokenHash(tokenHash);
    if (storeLink || !isSupabaseConfigured()) {
      return CampaignReviewStore.getPublicSnapshot(tokenHash);
    }

    const { data, error } = await supabase.rpc('get_public_review_snapshot', {
      p_token_hash: tokenHash,
    });

    if (error || !data) {
      return { status: 'not_found', error: 'Failed to connect to review service.' };
    }

    const res = data as any;
    if (res.status !== 'active') {
      return { status: res.status, error: res.error };
    }

    return {
      status: 'active',
      versionNumber: res.version_number,
      versionTitle: res.version_title,
      publishedAt: res.published_at,
      snapshot: res.snapshot,
      permissions: res.permissions,
      feedback: (res.feedback || []).map((f: any) => ({
        id: f.id,
        reviewLinkId: '',
        materialKey: f.material_key,
        variantKey: f.variant_key,
        reviewerName: f.reviewer_name || 'Reviewer',
        status: f.status,
        comment: f.comment,
        updatedAt: f.updated_at,
      })),
    };
  }

  public static async submitPublicFeedback(
    rawToken: string,
    materialKey: string,
    variantKey?: string,
    status: ReviewStatus = 'preferred',
    comment?: string,
    reviewerName: string = 'Reviewer'
  ): Promise<{ success: boolean; feedback?: ReviewFeedback; error?: string }> {
    const tokenHash = await hashReviewToken(rawToken);

    // Check store first for demo/offline links
    const storeLink = await CampaignReviewStore.getLinkByTokenHash(tokenHash);
    if (storeLink || !isSupabaseConfigured()) {
      return CampaignReviewStore.submitFeedback(tokenHash, materialKey, variantKey, status, comment, reviewerName);
    }

    const { data, error } = await supabase.rpc('submit_public_review_feedback', {
      p_token_hash: tokenHash,
      p_material_key: materialKey,
      p_variant_key: variantKey || (null as any),
      p_status: status,
      p_comment: comment || (null as any),
      p_reviewer_name: reviewerName,
    });

    if (error || !data) {
      return { success: false, error: error?.message || 'Feedback submission failed.' };
    }

    const res = data as any;
    return {
      success: res.success,
      error: res.error,
      feedback: res.feedback
        ? {
            id: res.feedback.id,
            reviewLinkId: '',
            materialKey: res.feedback.material_key,
            variantKey: res.feedback.variant_key,
            reviewerName: res.feedback.reviewer_name || 'Reviewer',
            status: res.feedback.status,
            comment: res.feedback.comment,
            updatedAt: res.feedback.updated_at,
          }
        : undefined,
    };
  }

  public static async submitPublicCampaignApproval(
    rawToken: string,
    status: 'approved' | 'needs_changes' = 'approved',
    notes?: string,
    reviewerName: string = 'Reviewer'
  ): Promise<{ success: boolean; status?: string; error?: string }> {
    const tokenHash = await hashReviewToken(rawToken);

    // Check store first for demo/offline links
    const storeLink = await CampaignReviewStore.getLinkByTokenHash(tokenHash);
    if (storeLink || !isSupabaseConfigured()) {
      return CampaignReviewStore.submitCampaignApproval(tokenHash, status, notes, reviewerName);
    }

    const { data, error } = await supabase.rpc('submit_public_campaign_approval', {
      p_token_hash: tokenHash,
      p_status: status,
      p_notes: notes || (null as any),
      p_reviewer_name: reviewerName,
    });

    if (error || !data) {
      return { success: false, error: error?.message || 'Campaign approval submission failed.' };
    }

    const res = data as any;
    return {
      success: res.success,
      status: res.status,
      error: res.error,
    };
  }
}
