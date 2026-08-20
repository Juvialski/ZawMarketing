import { supabase, isSupabaseConfigured } from './client';
import { Lead } from '../../types/leads';
import { SAMPLE_LEADS } from '../leads/leadResearchService';

export class LeadService {
  public static async getLeads(organizationId: string): Promise<Lead[]> {
    if (!isSupabaseConfigured()) {
      return SAMPLE_LEADS;
    }

    const { data, error } = await (supabase as any)
      .from('leads')
      .select('*')
      .eq('organization_id', organizationId)
      .order('lead_score', { ascending: false });

    if (error || !data || data.length === 0) {
      return SAMPLE_LEADS;
    }

    return data.map((row: any) => ({
      id: row.id,
      companyName: row.company_name,
      category: row.category,
      website: row.website || '',
      metroArea: row.metro_area,
      publicContactEmail: row.public_contact_email || undefined,
      publicPhone: row.public_phone || undefined,
      addressSummary: row.address_summary || undefined,
      estimatedPortfolioType: row.estimated_portfolio_type || undefined,
      leadScore: row.lead_score,
      relevanceReason: row.relevance_reason,
      sourceUrl: row.source_url || undefined,
      outreachAngle: row.outreach_angle as any,
      status: row.status || 'new',
    }));
  }

  public static async saveLeads(organizationId: string, leads: Lead[]): Promise<void> {
    if (!isSupabaseConfigured()) {
      return;
    }

    const rows = leads.map((l) => ({
      organization_id: organizationId,
      company_name: l.companyName,
      category: l.category,
      website: l.website || null,
      metro_area: l.metroArea,
      public_contact_email: l.publicContactEmail || null,
      public_phone: l.publicPhone || null,
      address_summary: l.addressSummary || null,
      estimated_portfolio_type: l.estimatedPortfolioType || null,
      lead_score: l.leadScore,
      relevance_reason: l.relevanceReason,
      source_url: l.sourceUrl || null,
      outreach_angle: l.outreachAngle as any,
      status: 'new',
    }));

    await (supabase as any).from('leads').upsert(rows);
  }
}
