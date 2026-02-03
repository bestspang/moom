import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay } from 'date-fns';

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

export const useActivityLogs = (startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['activity-logs', startDate?.toISOString(), endDate?.toISOString()],
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
        `)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startOfDay(startDate).toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endOfDay(endDate).toISOString());
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data as unknown as ActivityLogEntry[];
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
