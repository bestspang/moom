import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays } from 'date-fns';

export interface PackageMetrics {
  soldThisWeek: number;
  revenueToDate: number;
  activeCount: number;
  inactiveCount: number;
}

export const usePackageMetrics = (packageId: string) => {
  return useQuery({
    queryKey: ['package-metrics', packageId],
    queryFn: async (): Promise<PackageMetrics> => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();

      // Parallel server-side count/sum queries — avoids 1000-row limit
      const [soldWeekRes, revenueRes, activeRes, inactiveRes] = await Promise.all([
        // Sold this week: count transactions created in last 7 days
        supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('package_id', packageId)
          .gte('created_at', sevenDaysAgo),
        // Revenue: fetch only completed transactions amounts (need sum, so fetch amounts only)
        supabase
          .from('transactions')
          .select('amount')
          .eq('package_id', packageId)
          .eq('status', 'paid' as any),
        // Active member_packages count
        supabase
          .from('member_packages')
          .select('id', { count: 'exact', head: true })
          .eq('package_id', packageId)
          .eq('status', 'active'),
        // Inactive member_packages count
        supabase
          .from('member_packages')
          .select('id', { count: 'exact', head: true })
          .eq('package_id', packageId)
          .in('status', ['expired', 'completed', 'on_hold']),
      ]);

      if (soldWeekRes.error) throw soldWeekRes.error;
      if (revenueRes.error) throw revenueRes.error;
      if (activeRes.error) throw activeRes.error;
      if (inactiveRes.error) throw inactiveRes.error;

      const revenueToDate = (revenueRes.data || []).reduce(
        (sum, t) => sum + Number(t.amount || 0),
        0
      );

      return {
        soldThisWeek: soldWeekRes.count ?? 0,
        revenueToDate,
        activeCount: activeRes.count ?? 0,
        inactiveCount: inactiveRes.count ?? 0,
      };
    },
    enabled: !!packageId,
  });
};
