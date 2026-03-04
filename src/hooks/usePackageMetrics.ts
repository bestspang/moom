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

      // Parallel queries
      const [transactionsRes, memberPackagesRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('amount, created_at, status')
          .eq('package_id', packageId),
        supabase
          .from('member_packages')
          .select('status')
          .eq('package_id', packageId),
      ]);

      if (transactionsRes.error) throw transactionsRes.error;
      if (memberPackagesRes.error) throw memberPackagesRes.error;

      const transactions = transactionsRes.data || [];
      const memberPackages = memberPackagesRes.data || [];

      const soldThisWeek = transactions.filter(
        (t) => t.created_at && t.created_at >= sevenDaysAgo
      ).length;

      const revenueToDate = transactions
        .filter((t) => (t.status as string) === 'completed')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const activeCount = memberPackages.filter(
        (mp) => mp.status === 'active'
      ).length;

      const inactiveCount = memberPackages.filter(
        (mp) => mp.status && ['expired', 'completed', 'on_hold'].includes(mp.status)
      ).length;

      return { soldThisWeek, revenueToDate, activeCount, inactiveCount };
    },
    enabled: !!packageId,
  });
};
