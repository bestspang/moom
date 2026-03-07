import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { formatDateForDB } from '@/lib/formatters';
import { getBangkokDayRange } from '@/lib/dateRange';

export interface DashboardTrends {
  checkins7d: number[];
  classes7d: number[];
}

/**
 * Fetches 7-day daily counts for check-ins and scheduled classes
 * to power sparkline trends on dashboard StatCards.
 */
export const useDashboardTrends = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.dashboardStats(), 'trends-7d'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min
    queryFn: async (): Promise<DashboardTrends> => {
      const days: string[] = [];
      for (let i = 6; i >= 0; i--) {
        days.push(formatDateForDB(new Date(Date.now() - i * 86400000)));
      }

      // Parallel: fetch checkins + classes for 7 days
      const [checkinResults, classResults] = await Promise.all([
        Promise.all(
          days.map((day) => {
            const range = getBangkokDayRange(new Date(day + 'T00:00:00'));
            return supabase
              .from('member_attendance')
              .select('*', { count: 'exact', head: true })
              .gte('check_in_time', range.start)
              .lt('check_in_time', range.end);
          })
        ),
        Promise.all(
          days.map((day) =>
            supabase
              .from('schedule')
              .select('*', { count: 'exact', head: true })
              .eq('scheduled_date', day)
              .eq('status', 'scheduled')
          )
        ),
      ]);

      return {
        checkins7d: checkinResults.map((r) => r.count || 0),
        classes7d: classResults.map((r) => r.count || 0),
      };
    },
  });
};
