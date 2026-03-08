import { supabase } from '@/integrations/supabase/client';

interface GamificationEventParams {
  event_type: string;
  member_id: string;
  idempotency_key: string;
  location_id?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget gamification event.
 * Calls the gamification-process-event Edge Function.
 * Never throws — errors are logged silently.
 */
export async function fireGamificationEvent(params: GamificationEventParams): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('gamification-process-event', {
      body: {
        event_type: params.event_type,
        member_id: params.member_id,
        idempotency_key: params.idempotency_key,
        location_id: params.location_id ?? undefined,
        metadata: params.metadata ?? {},
      },
    });
    if (error) {
      console.warn('[gamification] Event failed (non-blocking):', params.event_type, error.message);
    }
  } catch (err) {
    console.warn('[gamification] Event failed (non-blocking):', params.event_type, err);
  }
}
