import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type TableName =
  | 'schedule'
  | 'member_attendance'
  | 'class_bookings'
  | 'class_waitlist'
  | 'rooms'
  | 'locations'
  | 'classes'
  | 'class_categories'
  | 'members'
  | 'member_packages'
  | 'package_usage_ledger'
  | 'leads';

const TABLE_INVALIDATION_MAP: Record<TableName, string[]> = {
  schedule: ['schedule', 'schedule-stats', 'dashboard-stats'],
  member_attendance: ['dashboard-stats', 'schedule'],
  class_bookings: ['class-bookings', 'member-bookings', 'booking-count', 'schedule'],
  class_waitlist: ['class-waitlist'],
  rooms: ['rooms', 'room-stats'],
  locations: ['locations', 'location-stats'],
  classes: ['classes', 'class-stats'],
  class_categories: ['class-stats', 'classes'],
  members: ['members', 'member', 'member-stats', 'high-risk-members', 'upcoming-birthdays'],
  member_packages: ['high-risk-members', 'member-bookings'],
  package_usage_ledger: ['member-bookings'],
  leads: ['leads', 'hot-leads'],
};

const SUBSCRIBED_TABLES: TableName[] = Object.keys(TABLE_INVALIDATION_MAP) as TableName[];

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let channel = supabase.channel('realtime-sync');

    for (const table of SUBSCRIBED_TABLES) {
      channel = channel.on<Record<string, unknown>>(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const prefixes = TABLE_INVALIDATION_MAP[table];
          if (!prefixes) return;

          // For schedule changes, try targeted invalidation by date
          if (table === 'schedule') {
            const record = (payload.new as Record<string, unknown>) || (payload.old as Record<string, unknown>);
            const scheduledDate = record?.scheduled_date as string | undefined;
            if (scheduledDate) {
              queryClient.invalidateQueries({ queryKey: ['schedule', scheduledDate] });
              queryClient.invalidateQueries({ queryKey: ['schedule-stats', scheduledDate] });
              queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
              return;
            }
          }

          // Broad prefix-match invalidation
          for (const prefix of prefixes) {
            queryClient.invalidateQueries({ queryKey: [prefix] });
          }
        }
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
