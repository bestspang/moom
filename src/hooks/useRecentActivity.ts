import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/queryKeys';

export interface RecentActivityItem {
  id: string;
  type: 'checkin' | 'purchase';
  name: string;
  detail: string;
  timestamp: string;
}

/**
 * Fetches last 5 check-ins + purchases from the past 2 hours
 * for the live activity feed on the dashboard.
 */
export const useRecentActivity = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.recentActivity(),
    enabled: !!user,
    refetchInterval: 30_000, // auto-refresh every 30s
    staleTime: 15_000,
    queryFn: async (): Promise<RecentActivityItem[]> => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      const [checkins, transactions] = await Promise.all([
        supabase
          .from('member_attendance')
          .select('id, check_in_time, member:members(first_name, last_name)')
          .gte('check_in_time', twoHoursAgo)
          .order('check_in_time', { ascending: false })
          .limit(5),
        supabase
          .from('transactions')
          .select('id, created_at, amount, member:members(first_name, last_name), package:packages(name)')
          .eq('status', 'paid')
          .gte('created_at', twoHoursAgo)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const items: RecentActivityItem[] = [];

      (checkins.data || []).forEach((c: any) => {
        const member = c.member;
        if (!member) return;
        items.push({
          id: `checkin-${c.id}`,
          type: 'checkin',
          name: `${member.first_name} ${member.last_name || ''}`.trim(),
          detail: 'checkedIn',
          timestamp: c.check_in_time,
        });
      });

      (transactions.data || []).forEach((t: any) => {
        const member = t.member;
        if (!member) return;
        items.push({
          id: `purchase-${t.id}`,
          type: 'purchase',
          name: `${member.first_name} ${member.last_name || ''}`.trim(),
          detail: (t.package as any)?.name || `฿${t.amount}`,
          timestamp: t.created_at,
        });
      });

      // Sort by most recent first, take top 5
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return items.slice(0, 5);
    },
  });
};
