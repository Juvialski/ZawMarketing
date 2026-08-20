import { supabase, isSupabaseConfigured } from './client';

export interface AppOrganization {
  id: string;
  name: string;
  slug: string;
  role: 'owner' | 'admin' | 'member';
}

const DEMO_ORGANIZATION: AppOrganization = {
  id: 'a0000000-0000-0000-0000-000000000001',
  name: 'Apex Capital Partners',
  slug: 'apex-capital-partners',
  role: 'owner',
};

export class OrganizationService {
  public static async getUserOrganizations(userId: string): Promise<AppOrganization[]> {
    if (!isSupabaseConfigured()) {
      return [DEMO_ORGANIZATION];
    }

    const { data, error } = await supabase
      .from('organization_members')
      .select('role, organizations(id, name, slug)')
      .eq('user_id', userId);

    if (error || !data || data.length === 0) {
      return [DEMO_ORGANIZATION];
    }

    return data.map((item: any) => ({
      id: item.organizations.id,
      name: item.organizations.name,
      slug: item.organizations.slug,
      role: item.role,
    }));
  }

  public static async getDefaultOrganization(userId: string): Promise<AppOrganization> {
    const orgs = await this.getUserOrganizations(userId);
    return orgs[0] || DEMO_ORGANIZATION;
  }
}
