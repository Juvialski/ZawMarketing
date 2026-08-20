import { supabase, isSupabaseConfigured } from './client';

export class StorageService {
  public static async uploadPropertyPhoto(
    organizationId: string,
    campaignId: string,
    file: File
  ): Promise<{ path: string; publicUrl: string }> {
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${organizationId}/${campaignId}/${Date.now()}-${Math.random().toString(36).substr(2, 5)}.${ext}`;

    if (!isSupabaseConfigured()) {
      // In local mode, return object URL
      return {
        path: filePath,
        publicUrl: URL.createObjectURL(file),
      };
    }

    const { error } = await supabase.storage
      .from('property-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.warn('Storage upload error, using local object URL', error);
      return {
        path: filePath,
        publicUrl: URL.createObjectURL(file),
      };
    }

    const { data } = supabase.storage.from('property-media').getPublicUrl(filePath);
    return {
      path: filePath,
      publicUrl: data.publicUrl,
    };
  }

  public static async uploadBrandLogo(
    organizationId: string,
    file: File
  ): Promise<{ path: string; publicUrl: string }> {
    const ext = file.name.split('.').pop() || 'png';
    const filePath = `${organizationId}/logo-${Date.now()}.${ext}`;

    if (!isSupabaseConfigured()) {
      return {
        path: filePath,
        publicUrl: URL.createObjectURL(file),
      };
    }

    const { error } = await supabase.storage
      .from('brand-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.warn('Logo upload error, using local URL', error);
      return {
        path: filePath,
        publicUrl: URL.createObjectURL(file),
      };
    }

    const { data } = supabase.storage.from('brand-assets').getPublicUrl(filePath);
    return {
      path: filePath,
      publicUrl: data.publicUrl,
    };
  }

  public static async uploadDesignExport(
    organizationId: string,
    campaignId: string,
    filename: string,
    blob: Blob
  ): Promise<{ path: string; publicUrl: string }> {
    const filePath = `${organizationId}/${campaignId}/${filename}`;

    if (!isSupabaseConfigured()) {
      return {
        path: filePath,
        publicUrl: URL.createObjectURL(blob),
      };
    }

    const { error } = await supabase.storage
      .from('campaign-exports')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.warn('Export upload error, using local URL', error);
      return {
        path: filePath,
        publicUrl: URL.createObjectURL(blob),
      };
    }

    const { data } = supabase.storage.from('campaign-exports').getPublicUrl(filePath);
    return {
      path: filePath,
      publicUrl: data.publicUrl,
    };
  }
}
