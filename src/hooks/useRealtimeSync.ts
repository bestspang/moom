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
  | 'leads'
  | 'ai_suggestions'
  | 'packages'
  | 'promotions'
  | 'promotion_packages'
  | 'promotion_redemptions'
  | 'transactions'
  | 'training_templates'
  | 'workout_items'
  | 'staff'
  | 'staff_positions'
  | 'role_permissions'
  | 'activity_log'
  | 'announcements'
  | 'member_notes'
  | 'member_injuries'
  | 'member_suspensions'
  | 'member_contracts'
  | 'member_billing';

const TABLE_INVALIDATION_MAP: Record<TableName, string[]> = {
  schedule: ['schedule', 'schedule-stats', 'dashboard-stats'],
  member_attendance: ['dashboard-stats', 'schedule', 'member-attendance', 'member-summary-stats', 'gym-checkins', 'check-ins', 'members-enrichment'],
  class_bookings: ['class-bookings', 'member-bookings', 'booking-count', 'schedule', 'class-performance'],
  class_waitlist: ['class-waitlist'],
  rooms: ['rooms', 'room-stats'],
  locations: ['locations', 'location-stats'],
  classes: ['classes', 'class-stats', 'class-performance'],
  class_categories: ['class-categories', 'class-stats', 'classes'],
  members: ['members', 'member', 'member-stats', 'high-risk-members', 'upcoming-birthdays'],
  member_packages: ['high-risk-members', 'member-bookings', 'member-packages', 'package-metrics', 'packages', 'members-enrichment'],
  package_usage_ledger: ['member-bookings', 'package-usage', 'package-usage-summary', 'package-metrics'],
  leads: ['leads', 'hot-leads'],
  ai_suggestions: ['ai-suggestions'],
  packages: ['packages', 'package-stats', 'package-metrics'],
  promotions: ['promotions', 'promotion-stats', 'promotion-packages'],
  promotion_packages: ['promotion-packages', 'promotions'],
  promotion_redemptions: ['promotion-redemptions', 'promotions', 'promotion-stats'],
  transactions: ['transactions', 'finance-transactions', 'finance-stats', 'transfer-slips', 'transfer-slip-stats', 'package-metrics', 'dashboard-stats'],
  training_templates: ['training-templates'],
  workout_items: ['training-templates'],
  staff: ['staff', 'staff-stats'],
  staff_positions: ['staff', 'staff-positions'],
  role_permissions: ['roles', 'role-permissions', 'my-permissions'],
  activity_log: ['activity-logs'],
  announcements: ['announcements', 'announcement-stats'],
  member_notes: ['member-notes'],
  member_injuries: ['member-injuries'],
  member_suspensions: ['member-suspensions'],
  member_contracts: ['member-contracts', 'members-enrichment'],
  member_billing: ['member-billing', 'member-summary-stats'],
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
