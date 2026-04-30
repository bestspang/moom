import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Returns 12 buckets of check-in counts covering the last 12 hours
 * (1-hour buckets, oldest first). Used by the LivePulseCard sparkline.
 */
export const useCheckin12hSeries = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...queryKeys.dashboardStats(), 'checkin-12h'],
    enabled: !!user,
    refetchInterval: 60_000,
    staleTime: 30_000,
    queryFn: async (): Promise<number[]> => {
      const now = Date.now();
      const buckets: { start: string; end: string }[] = [];
      for (let i = 11; i >= 0; i--) {
        const start = new Date(now - (i + 1) * 60 * 60 * 1000).toISOString();
        const end = new Date(now - i * 60 * 60 * 1000).toISOString();
        buckets.push({ start, end });
      }
      const counts = await Promise.all(
        buckets.map(({ start, end }) =>
          supabase
            .from('member_attendance')
            .select('*', { count: 'exact', head: true })
            .gte('check_in_time', start)
            .lt('check_in_time', end)
            .then((r) => r.count || 0),
        ),
      );
      return counts;
    },
  });
};
