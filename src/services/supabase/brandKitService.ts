import { supabase, isSupabaseConfigured } from './client';
import { BrandKit, DEFAULT_BRAND_KIT } from '../../types/brandKit';
import { BrandKitStore } from '../storage/brandKitStore';

export class BrandKitService {
  public static async getBrandKit(organizationId: string): Promise<BrandKit> {
    if (!isSupabaseConfigured()) {
      return BrandKitStore.get();
    }

    const { data, error } = await (supabase as any)
      .from('brand_kits')
      .select('*')
      .eq('organization_id', organizationId)
      .order('is_default', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return BrandKitStore.get();
    }

    return {
      id: data.id,
      isDefault: data.is_default,
      companyName: data.company_name,
      tagline: data.tagline || undefined,
      logoUrl: data.logo_url || undefined,
      logoDarkUrl: data.logo_dark_url || undefined,
      website: data.website || 'www.apexcapitalpartners.com',
      phone: data.phone || '(480) 555-0194',
      email: data.email || 'acquisitions@apexcapitalpartners.com',
      licenseNumber: data.license_number || undefined,
      colors: (data.colors as any) || DEFAULT_BRAND_KIT.colors,
      typography: (data.typography as any) || DEFAULT_BRAND_KIT.typography,
      toneOfVoice: (data.tone_of_voice as any) || DEFAULT_BRAND_KIT.toneOfVoice,
      targetAudienceDefault: data.target_audience_default,
      preferredCta: data.preferred_cta,
      requiredDisclaimer: data.required_disclaimer,
      forbiddenWords: data.forbidden_words || DEFAULT_BRAND_KIT.forbiddenWords,
      imageStylePreference: (data.image_style_preference as any) || DEFAULT_BRAND_KIT.imageStylePreference,
    };
  }

  public static async saveBrandKit(organizationId: string, brandKit: BrandKit): Promise<BrandKit> {
    // Keep local store in sync
    BrandKitStore.save(brandKit);

    if (!isSupabaseConfigured()) {
      return brandKit;
    }

    const payload = {
      organization_id: organizationId,
      company_name: brandKit.companyName,
      tagline: brandKit.tagline || null,
      logo_url: brandKit.logoUrl || null,
      logo_dark_url: brandKit.logoDarkUrl || null,
      website: brandKit.website,
      phone: brandKit.phone,
      email: brandKit.email,
      license_number: brandKit.licenseNumber || null,
      colors: brandKit.colors as any,
      typography: brandKit.typography as any,
      tone_of_voice: brandKit.toneOfVoice,
      target_audience_default: brandKit.targetAudienceDefault,
      preferred_cta: brandKit.preferredCta,
      required_disclaimer: brandKit.requiredDisclaimer,
      forbidden_words: brandKit.forbiddenWords,
      image_style_preference: brandKit.imageStylePreference,
      updated_at: new Date().toISOString(),
    };

    if (brandKit.id && brandKit.id !== 'apex-default-brand-kit') {
      await (supabase as any).from('brand_kits').update(payload).eq('id', brandKit.id);
    } else {
      const { data } = await (supabase as any).from('brand_kits').insert(payload).select('id').single();
      if (data) {
        brandKit.id = data.id;
      }
    }

    return brandKit;
  }
}
