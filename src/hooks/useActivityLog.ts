import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay } from 'date-fns';

export interface ActivityLogEntry {
  id: string;
  event_type: string;
  activity: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string | null;
  staff: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  member: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

export interface UseActivityLogsParams {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: string[];
  page?: number;
  perPage?: number;
}

export const ALL_EVENT_TYPES = [
  'member_created',
  'member_updated',
  'member_deleted',
  'staff_created',
  'staff_updated',
  'staff_deleted',
  'staff_invited',
  'class_created',
  'class_updated',
  'class_deleted',
  'class_category_created',
  'class_category_updated',
  'class_category_deleted',
  'room_created',
  'room_updated',
  'room_deleted',
  'package_created',
  'package_updated',
  'package_deleted',
  'package_archived',
  'schedule_created',
  'schedule_updated',
  'schedule_deleted',
  'promotion_created',
  'promotion_updated',
  'location_created',
  'location_updated',
  'role_updated',
  'announcement_created',
  'announcement_updated',
  'announcement_deleted',
  'booking_created',
  'booking_cancelled',
  'attendance_marked',
  'lead_created',
  'lead_updated',
  'lead_deleted',
  'lead_converted',
  'training_created',
  'training_updated',
  'transaction_status_updated',
  'setting_updated',
  'check_in',
] as const;

export type EventType = (typeof ALL_EVENT_TYPES)[number];

export const useActivityLogs = ({
  startDate,
  endDate,
  eventTypes = [],
  page = 1,
  perPage = 25,
}: UseActivityLogsParams = {}) => {
  return useQuery({
    queryKey: ['activity-logs', startDate?.toISOString(), endDate?.toISOString(), eventTypes, page, perPage],
    queryFn: async () => {
      let query = supabase
        .from('activity_log')
        .select(`
          id,
          event_type,
          activity,
          old_value,
          new_value,
          entity_type,
          entity_id,
          created_at,
          staff:staff_id (
            id,
            first_name,
            last_name
          ),
          member:member_id (
            id,
            first_name,
            last_name
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startOfDay(startDate).toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endOfDay(endDate).toISOString());
      }
      if (eventTypes.length > 0) {
        query = query.in('event_type', eventTypes);
      }

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;
      return {
        data: data as unknown as ActivityLogEntry[],
        total: count || 0,
      };
    },
  });
};

// Helper to format value changes for display
export const formatValueChange = (
  oldValue: Record<string, unknown> | null,
  newValue: Record<string, unknown> | null
): string => {
  if (!oldValue && !newValue) return '';
  
  const changes: string[] = [];
  
  if (newValue) {
    Object.keys(newValue).forEach((key) => {
      const oldVal = oldValue?.[key];
      const newVal = newValue[key];
      
      if (oldVal !== newVal) {
        if (oldVal !== undefined) {
          changes.push(`${key}: ${String(oldVal)} → ${String(newVal)}`);
        } else {
          changes.push(`${key}: ${String(newVal)}`);
        }
      }
    });
  }
  
  return changes.join(', ');
};
