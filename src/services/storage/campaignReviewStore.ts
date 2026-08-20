/**
 * Local Storage Store for Campaign Review Links, Versions, and Reviewer Feedback (Demo / Offline Workspaces)
 */

import { ReviewLink, ReviewVersion, ReviewFeedback, ReviewLinkPermissions, PublicReviewPortalResponse, ReviewStatus } from '../../types/review';
import { Campaign } from '../../types/campaign';
import { BrandKit } from '../../types/brandKit';
import { generateSecureReviewToken, hashReviewToken } from '../review/reviewCrypto';
import { buildReviewSnapshot } from '../review/reviewSnapshotBuilder';

const LINKS_KEY = 'zaw_review_links_v1';
const VERSIONS_KEY = 'zaw_review_versions_v1';
const FEEDBACK_KEY = 'zaw_review_feedback_v1';

const getStorage = (): Storage | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    if (typeof localStorage !== 'undefined') return localStorage;
    return null;
  } catch {
    return null;
  }
};

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export class CampaignReviewStore {
  // ---------------- Links ----------------
  public static getAllLinks(): ReviewLink[] {
    const s = getStorage();
    if (!s) return [];
    try {
      const data = s.getItem(LINKS_KEY);
      return data ? (JSON.parse(data) as ReviewLink[]) : [];
    } catch {
      return [];
    }
  }

  private static saveLinks(links: ReviewLink[]): void {
    const s = getStorage();
    if (!s) return;
    try {
      s.setItem(LINKS_KEY, JSON.stringify(links));
    } catch (e) {
      console.error('Failed to save review links', e);
    }
  }

  public static getLinksByCampaign(campaignId: string): ReviewLink[] {
    return this.getAllLinks().filter((l) => l.campaignId === campaignId);
  }

  public static getActiveLinkByCampaign(campaignId: string): ReviewLink | undefined {
    return this.getLinksByCampaign(campaignId).find((l) => l.isActive);
  }

  public static async getLinkByTokenHash(tokenHash: string): Promise<ReviewLink | undefined> {
    return this.getAllLinks().find((l) => l.tokenHash === tokenHash);
  }

  public static async createReviewLink(
    campaign: Campaign,
    brandKit: BrandKit,
    permissions?: Partial<ReviewLinkPermissions>,
    expiresAt: string | null = null
  ): Promise<{ link: ReviewLink; rawToken: string; version: ReviewVersion }> {
    const rawToken = generateSecureReviewToken();
    const tokenHash = await hashReviewToken(rawToken);
    const linkId = `link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const fullPermissions: ReviewLinkPermissions = {
      allowComments: permissions?.allowComments ?? true,
      allowSelection: permissions?.allowSelection ?? true,
      allowApproval: permissions?.allowApproval ?? true,
      allowDownloads: permissions?.allowDownloads ?? false,
    };

    const link: ReviewLink = {
      id: linkId,
      organizationId: 'demo-org',
      campaignId: campaign.id,
      tokenHash,
      rawToken,
      isActive: true,
      expiresAt,
      permissions: fullPermissions,
      currentVersionNumber: 1,
      createdAt: now,
      updatedAt: now,
    };

    // Build initial snapshot version
    const snapshot = buildReviewSnapshot(campaign, brandKit);
    const version: ReviewVersion = {
      id: `ver-${linkId}-1`,
      reviewLinkId: linkId,
      versionNumber: 1,
      title: 'Review Package v1',
      publishedAt: now,
      snapshot,
    };

    const links = this.getAllLinks();
    // Deactivate previous links for this campaign if any
    const updatedLinks = links.map((l) => (l.campaignId === campaign.id ? { ...l, isActive: false } : l));
    updatedLinks.unshift(link);
    this.saveLinks(updatedLinks);

    const versions = this.getAllVersions();
    versions.unshift(version);
    this.saveVersions(versions);

    return { link: clone(link), rawToken, version: clone(version) };
  }

  public static async rotateReviewLink(
    linkId: string,
    campaign: Campaign,
    brandKit: BrandKit
  ): Promise<{ link: ReviewLink; rawToken: string }> {
    const rawToken = generateSecureReviewToken();
    const tokenHash = await hashReviewToken(rawToken);
    const now = new Date().toISOString();

    const links = this.getAllLinks();
    const targetIndex = links.findIndex((l) => l.id === linkId);
    if (targetIndex < 0) {
      return this.createReviewLink(campaign, brandKit);
    }

    const currentLink = links[targetIndex];
    const updatedLink: ReviewLink = {
      ...currentLink,
      tokenHash,
      rawToken,
      isActive: true,
      updatedAt: now,
    };

    links[targetIndex] = updatedLink;
    this.saveLinks(links);

    return { link: clone(updatedLink), rawToken };
  }

  public static revokeReviewLink(linkId: string): boolean {
    const links = this.getAllLinks();
    const target = links.find((l) => l.id === linkId);
    if (!target) return false;
    target.isActive = false;
    target.updatedAt = new Date().toISOString();
    this.saveLinks(links);
    return true;
  }

  public static updatePermissions(
    linkId: string,
    permissions: ReviewLinkPermissions,
    expiresAt?: string | null
  ): ReviewLink | null {
    const links = this.getAllLinks();
    const target = links.find((l) => l.id === linkId);
    if (!target) return null;
    target.permissions = permissions;
    if (expiresAt !== undefined) target.expiresAt = expiresAt;
    target.updatedAt = new Date().toISOString();
    this.saveLinks(links);
    return clone(target);
  }

  // ---------------- Versions ----------------
  public static getAllVersions(): ReviewVersion[] {
    const s = getStorage();
    if (!s) return [];
    try {
      const data = s.getItem(VERSIONS_KEY);
      return data ? (JSON.parse(data) as ReviewVersion[]) : [];
    } catch {
      return [];
    }
  }

  private static saveVersions(versions: ReviewVersion[]): void {
    const s = getStorage();
    if (!s) return;
    try {
      s.setItem(VERSIONS_KEY, JSON.stringify(versions));
    } catch (e) {
      console.error('Failed to save review versions', e);
    }
  }

  public static getVersionsByLinkId(linkId: string): ReviewVersion[] {
    return this.getAllVersions()
      .filter((v) => v.reviewLinkId === linkId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  public static getLatestVersion(linkId: string): ReviewVersion | undefined {
    return this.getVersionsByLinkId(linkId)[0];
  }

  public static async publishNewVersion(
    linkId: string,
    campaign: Campaign,
    brandKit: BrandKit,
    title?: string,
    notes?: string
  ): Promise<ReviewVersion | null> {
    const links = this.getAllLinks();
    const link = links.find((l) => l.id === linkId);
    if (!link) return null;

    const currentVersions = this.getVersionsByLinkId(linkId);
    const nextVersionNum = (currentVersions[0]?.versionNumber || link.currentVersionNumber || 0) + 1;
    const now = new Date().toISOString();

    const snapshot = buildReviewSnapshot(campaign, brandKit);
    const newVersion: ReviewVersion = {
      id: `ver-${linkId}-${nextVersionNum}`,
      reviewLinkId: linkId,
      versionNumber: nextVersionNum,
      title: title || `Review Package v${nextVersionNum}`,
      notes,
      publishedAt: now,
      snapshot,
    };

    link.currentVersionNumber = nextVersionNum;
    link.updatedAt = now;
    this.saveLinks(links);

    const allVersions = this.getAllVersions();
    allVersions.unshift(newVersion);
    this.saveVersions(allVersions);

    return clone(newVersion);
  }

  // ---------------- Feedback ----------------
  public static getAllFeedback(): ReviewFeedback[] {
    const s = getStorage();
    if (!s) return [];
    try {
      const data = s.getItem(FEEDBACK_KEY);
      return data ? (JSON.parse(data) as ReviewFeedback[]) : [];
    } catch {
      return [];
    }
  }

  private static saveFeedback(feedbackList: ReviewFeedback[]): void {
    const s = getStorage();
    if (!s) return;
    try {
      s.setItem(FEEDBACK_KEY, JSON.stringify(feedbackList));
    } catch (e) {
      console.error('Failed to save review feedback', e);
    }
  }

  public static getFeedbackByLinkId(linkId: string): ReviewFeedback[] {
    return this.getAllFeedback().filter((f) => f.reviewLinkId === linkId);
  }

  // ---------------- Public Access & RPC Simulation ----------------
  public static async getPublicSnapshot(tokenHash: string): Promise<PublicReviewPortalResponse> {
    const link = await this.getLinkByTokenHash(tokenHash);
    if (!link) {
      return { status: 'not_found', error: 'This review link does not exist or is invalid.' };
    }

    if (!link.isActive) {
      return { status: 'revoked', error: 'This review link is no longer active.' };
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return { status: 'expired', error: 'This review link has expired.' };
    }

    const latestVersion = this.getLatestVersion(link.id);
    if (!latestVersion) {
      return { status: 'no_version', error: 'No published review package is available.' };
    }

    const feedback = this.getFeedbackByLinkId(link.id);

    return {
      status: 'active',
      versionNumber: latestVersion.versionNumber,
      versionTitle: latestVersion.title,
      publishedAt: latestVersion.publishedAt,
      snapshot: clone(latestVersion.snapshot),
      permissions: clone(link.permissions),
      feedback: clone(feedback),
    };
  }

  public static async submitFeedback(
    tokenHash: string,
    materialKey: string,
    variantKey?: string,
    status: ReviewStatus = 'preferred',
    comment?: string,
    reviewerName: string = 'Reviewer'
  ): Promise<{ success: boolean; feedback?: ReviewFeedback; error?: string }> {
    const link = await this.getLinkByTokenHash(tokenHash);
    if (!link || !link.isActive || (link.expiresAt && new Date(link.expiresAt) < new Date())) {
      return { success: false, error: 'This review link is not active or has expired.' };
    }

    if (status === 'preferred' && !link.permissions.allowSelection) {
      return { success: false, error: 'Variant selection is disabled for this link.' };
    }
    if ((status === 'approved' || status === 'needs_changes') && !link.permissions.allowApproval) {
      return { success: false, error: 'Approvals are disabled for this link.' };
    }
    if (comment && !link.permissions.allowComments) {
      return { success: false, error: 'Comments are disabled for this link.' };
    }

    const latestVersion = this.getLatestVersion(link.id);
    const now = new Date().toISOString();
    const allFeedback = this.getAllFeedback();

    // If status is 'preferred', set existing preferred for same material/reviewer to not_reviewed
    if (status === 'preferred') {
      allFeedback.forEach((f) => {
        if (f.reviewLinkId === link.id && f.materialKey === materialKey && f.reviewerName === reviewerName && f.status === 'preferred') {
          f.status = 'not_reviewed';
          f.updatedAt = now;
        }
      });
    }

    // Check if feedback item exists for this exact material & variant & reviewer
    const existingIndex = allFeedback.findIndex(
      (f) =>
        f.reviewLinkId === link.id &&
        f.materialKey === materialKey &&
        (variantKey ? f.variantKey === variantKey : true) &&
        f.reviewerName === reviewerName
    );

    let feedbackItem: ReviewFeedback;
    if (existingIndex >= 0) {
      allFeedback[existingIndex] = {
        ...allFeedback[existingIndex],
        variantKey: variantKey || allFeedback[existingIndex].variantKey,
        status,
        comment: comment !== undefined ? comment : allFeedback[existingIndex].comment,
        updatedAt: now,
      };
      feedbackItem = allFeedback[existingIndex];
    } else {
      feedbackItem = {
        id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        reviewLinkId: link.id,
        reviewVersionId: latestVersion?.id,
        materialKey,
        variantKey,
        reviewerName,
        status,
        comment,
        updatedAt: now,
      };
      allFeedback.unshift(feedbackItem);
    }

    this.saveFeedback(allFeedback);
    return { success: true, feedback: clone(feedbackItem) };
  }

  public static async submitCampaignApproval(
    tokenHash: string,
    status: 'approved' | 'needs_changes' = 'approved',
    notes?: string,
    reviewerName: string = 'Reviewer'
  ): Promise<{ success: boolean; status?: string; error?: string }> {
    const link = await this.getLinkByTokenHash(tokenHash);
    if (!link || !link.isActive || (link.expiresAt && new Date(link.expiresAt) < new Date())) {
      return { success: false, error: 'This review link is not active or has expired.' };
    }

    if (!link.permissions.allowApproval) {
      return { success: false, error: 'Campaign approval is disabled for this link.' };
    }

    const latestVersion = this.getLatestVersion(link.id);
    const now = new Date().toISOString();
    const allFeedback = this.getAllFeedback();

    const approvalItem: ReviewFeedback = {
      id: `fb-campaign-${Date.now()}`,
      reviewLinkId: link.id,
      reviewVersionId: latestVersion?.id,
      materialKey: 'campaign_overall',
      reviewerName,
      status,
      comment: notes,
      updatedAt: now,
    };

    allFeedback.unshift(approvalItem);
    this.saveFeedback(allFeedback);

    return { success: true, status };
  }
}
