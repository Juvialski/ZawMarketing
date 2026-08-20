import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types/database.types';

const env = (import.meta as any).env || {};
export const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://csolgywkgummefnwouny.supabase.co';
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(
      SUPABASE_URL,
      SUPABASE_ANON_KEY || 'placeholder-anon-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );
  }
  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_ANON_KEY.includes('your_anon_key_here') &&
    SUPABASE_ANON_KEY !== 'placeholder-anon-key'
  );
}

export const supabase = getSupabaseClient();
