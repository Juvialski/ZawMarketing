import { supabase, isSupabaseConfigured } from './client';

export interface AILogEntry {
  organizationId?: string;
  userId?: string;
  campaignId?: string;
  operationType: string;
  provider: string;
  model: string;
  status: 'success' | 'failed';
  latencyMs?: number;
  errorMessage?: string;
}

export class AILogService {
  public static async log(entry: AILogEntry): Promise<void> {
    if (!isSupabaseConfigured()) {
      return;
    }

    try {
      await (supabase as any).from('ai_generation_logs').insert({
        organization_id: entry.organizationId || null,
        user_id: entry.userId || null,
        campaign_id: entry.campaignId || null,
        operation_type: entry.operationType,
        provider: entry.provider,
        model: entry.model,
        status: entry.status,
        latency_ms: entry.latencyMs || null,
        error_message: entry.errorMessage || null,
      });
    } catch (e) {
      console.warn('Failed to insert AI generation log', e);
    }
  }
}
