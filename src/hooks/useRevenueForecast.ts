import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { queryKeys } from '@/lib/queryKeys';

export interface RevenueForecastData {
  lastMonth: number;
  thisMonth: number;
  projectedNextMonth: number;
}

export function useRevenueForecast() {
  return useQuery({
    queryKey: queryKeys.revenueForecast(),
    queryFn: async (): Promise<RevenueForecastData> => {
      const now = new Date();
      const thisMonthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const thisMonthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
      const lastMonthStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
      const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');

      // This month's confirmed revenue
      const { data: thisMonthTx } = await supabase
        .from('transactions')
        .select('amount')
        .eq('status', 'paid')
        .gte('created_at', thisMonthStart)
        .lte('created_at', thisMonthEnd);

      const thisMonth = (thisMonthTx || []).reduce((sum, t) => sum + Number(t.amount || 0), 0);

      // Last month's confirmed revenue
      const { data: lastMonthTx } = await supabase
        .from('transactions')
        .select('amount')
        .eq('status', 'paid')
        .gte('created_at', lastMonthStart)
        .lte('created_at', lastMonthEnd);

      const lastMonth = (lastMonthTx || []).reduce((sum, t) => sum + Number(t.amount || 0), 0);

      // Projected next month: count active packages × avg package price
      const { data: activePackages } = await supabase
        .from('member_packages')
        .select('package_id')
        .in('status', ['active', 'ready_to_use']);

      const { data: allPackages } = await supabase
        .from('packages')
        .select('id, price');

      const priceMap = new Map<string, number>();
      for (const p of allPackages || []) {
        priceMap.set(p.id, Number(p.price || 0));
      }

      let projectedNextMonth = 0;
      for (const mp of activePackages || []) {
        projectedNextMonth += priceMap.get(mp.package_id) || 0;
      }

      // Simple heuristic: take average of last/this month and active package value
      // Use the higher of the two as a conservative forecast
      if (projectedNextMonth === 0 && (thisMonth > 0 || lastMonth > 0)) {
        projectedNextMonth = Math.round((thisMonth + lastMonth) / 2);
      }

      return { lastMonth, thisMonth, projectedNextMonth };
    },
    staleTime: 10 * 60 * 1000,
  });
}
