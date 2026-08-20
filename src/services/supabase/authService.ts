import { supabase, isSupabaseConfigured } from './client';
import { User, Session } from '@supabase/supabase-js';

export interface AppProfile {
  id: string;
  displayName: string;
  companyName: string;
  avatarUrl?: string;
}

const DEMO_USER: User = {
  id: 'a0000000-0000-0000-0000-000000000001',
  app_metadata: {},
  user_metadata: {
    display_name: 'Al (Apex Acquisitions)',
    company_name: 'Apex Capital & Acquisitions',
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'acquisitions@apexcapitalpartners.com',
  phone: '',
  role: 'authenticated',
  updated_at: new Date().toISOString(),
};

export class AuthService {
  public static async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Failed to get Supabase session', error);
      return null;
    }
    return data.session;
  }

  public static async getUser(): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      return DEMO_USER;
    }
    const { data } = await supabase.auth.getUser();
    return data.user || DEMO_USER;
  }

  public static async signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { user: DEMO_USER, error: null };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { user: data.user, error };
  }

  public static async signUp(
    email: string,
    password: string,
    displayName: string,
    companyName: string
  ): Promise<{ user: User | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { user: DEMO_USER, error: null };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          company_name: companyName,
        },
      },
    });
    return { user: data.user, error };
  }

  public static async signOut(): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
  }

  public static onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    if (!isSupabaseConfigured()) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
  }

  public static async getProfile(userId: string): Promise<AppProfile | null> {
    if (!isSupabaseConfigured()) {
      return {
        id: DEMO_USER.id,
        displayName: 'Al (Apex Acquisitions)',
        companyName: 'Apex Capital & Acquisitions',
      };
    }

    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return {
        id: userId,
        displayName: 'Apex Acquisitions Desk',
        companyName: 'Apex Capital & Acquisitions',
      };
    }

    return {
      id: data.id,
      displayName: data.display_name || 'Acquisitions Team',
      companyName: data.company_name || 'Apex Capital Partners',
      avatarUrl: data.avatar_url || undefined,
    };
  }
}
