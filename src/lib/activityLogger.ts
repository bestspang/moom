import { supabase } from '@/integrations/supabase/client';

export interface LogActivityParams {
  event_type: string;
  /** Optional human-readable summary. Defaults to event_type if not provided. */
  activity?: string;
  entity_type?: string;
  entity_id?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  /** Free-form metadata; stored alongside new_value as JSON. */
  metadata?: Record<string, unknown>;
  staff_id?: string;
  member_id?: string;
  location_id?: string;
}

/**
 * Fire-and-forget audit logger.
 * Inserts into `activity_log` without blocking the caller.
 *
 * `metadata` is merged into `new_value` for storage (single JSONB column).
 */
export function logActivity(params: LogActivityParams): void {
  const mergedNewValue =
    params.new_value || params.metadata
      ? { ...(params.new_value ?? {}), ...(params.metadata ?? {}) }
      : null;

  supabase
    .from('activity_log')
    .insert({
      event_type: params.event_type,
      activity: params.activity ?? params.event_type,
      entity_type: params.entity_type ?? null,
      entity_id: params.entity_id ?? null,
      old_value: (params.old_value as any) ?? null,
      new_value: (mergedNewValue as any) ?? null,
      staff_id: params.staff_id ?? null,
      member_id: params.member_id ?? null,
      location_id: params.location_id ?? null,
    })
    .then(({ error }) => {
      if (error) {
        console.warn('[activityLogger] Failed to log activity:', error.message);
      }
    });
}
