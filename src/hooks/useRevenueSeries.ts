import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { formatDateForDB } from '@/lib/formatters';
import { getBangkokDayRange } from '@/lib/dateRange';
import type { RevenueRange } from '@/components/admin-ds';

export interface RevenueSeriesPoint {
  date: string;   // ISO yyyy-mm-dd
  label: string;  // short display label (e.g. "1 พ.ย." or "1")
  value: number;
}

const labelFor = (d: Date): string =>
  `${d.getDate()}`;

/**
 * Revenue time series for the dashboard area chart.
 * Returns one bucket per day. Range:
 *  - 7d  : last 7 days
 *  - 30d : last 30 days
 *  - mtd : month-to-date
 *  - ytd : last 12 months (bucketed by month — value still per-month, label = month)
 */
export const useRevenueSeries = (range: RevenueRange) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.dashboardStats(), 'revenue-series', range],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<RevenueSeriesPoint[]> => {
      const now = new Date();

      if (range === 'ytd') {
        // 12 months bucket
        const points: RevenueSeriesPoint[] = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
          const { data } = await supabase
            .from('transactions')
            .select('amount')
            .gte('created_at', start)
            .lt('created_at', end)
            .eq('status', 'paid');
          const value = (data || []).reduce((s, t) => s + (Number(t.amount) || 0), 0);
          points.push({
            date: formatDateForDB(d),
            label: d.toLocaleDateString('th-TH', { month: 'short' }),
            value,
          });
        }
        return points;
      }

      // Day-bucket modes
      let days: Date[] = [];
      if (range === '7d') {
        for (let i = 6; i >= 0; i--) {
          days.push(new Date(Date.now() - i * 86400000));
        }
      } else if (range === '30d') {
        for (let i = 29; i >= 0; i--) {
          days.push(new Date(Date.now() - i * 86400000));
        }
      } else if (range === 'mtd') {
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        for (let d = new Date(first); d <= now; d.setDate(d.getDate() + 1)) {
          days.push(new Date(d));
        }
      }

      const results = await Promise.all(
        days.map(async (d) => {
          const range = getBangkokDayRange(d);
          const { data } = await supabase
            .from('transactions')
            .select('amount')
            .gte('created_at', range.start)
            .lt('created_at', range.end)
            .eq('status', 'paid');
          const value = (data || []).reduce(
            (s, t) => s + (Number(t.amount) || 0),
            0,
          );
          return {
            date: formatDateForDB(d),
            label: labelFor(d),
            value,
          };
        }),
      );

      return results;
    },
  });
};
