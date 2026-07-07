import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { formatDateForDB } from '@/lib/formatters';
import { getBangkokDayRange } from '@/lib/dateRange';
import type { RevenueRange } from '@/components/admin-ds';

export interface RevenueSeriesPoint {
  date: string;
  label: string;
  value: number;
}

export interface RevenueSeriesResult {
  points: RevenueSeriesPoint[];
  total: number;
  /** Count of status='paid' transactions within the same window that have paid_at IS NULL. */
  missingPaidAtCount: number;
}

const labelFor = (d: Date): string => `${d.getDate()}`;

/**
 * Revenue time series for the dashboard area chart.
 * Uses `created_at` as the bucket key (the app records paid transactions
 * via created_at). Also reports how many `status='paid'` rows in the same
 * window have `paid_at IS NULL` so the UI can warn instead of silently
 * showing ฿0 when data quality is bad.
 */
export const useRevenueSeries = (range: RevenueRange) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.dashboardStats(), 'revenue-series', range],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<RevenueSeriesResult> => {
      const now = new Date();

      let windowStart: string;
      let windowEnd: string;
      const points: RevenueSeriesPoint[] = [];

      if (range === 'ytd') {
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
        windowStart = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString();
        windowEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      } else {
        const days: Date[] = [];
        if (range === '7d') {
          for (let i = 6; i >= 0; i--) days.push(new Date(Date.now() - i * 86400000));
        } else if (range === '30d') {
          for (let i = 29; i >= 0; i--) days.push(new Date(Date.now() - i * 86400000));
        } else {
          const first = new Date(now.getFullYear(), now.getMonth(), 1);
          for (let d = new Date(first); d <= now; d.setDate(d.getDate() + 1)) days.push(new Date(d));
        }

        const results = await Promise.all(
          days.map(async (d) => {
            const r = getBangkokDayRange(d);
            const { data } = await supabase
              .from('transactions')
              .select('amount')
              .gte('created_at', r.start)
              .lt('created_at', r.end)
              .eq('status', 'paid');
            const value = (data || []).reduce((s, t) => s + (Number(t.amount) || 0), 0);
            return { date: formatDateForDB(d), label: labelFor(d), value };
          }),
        );
        points.push(...results);
        windowStart = getBangkokDayRange(days[0]).start;
        windowEnd = getBangkokDayRange(days[days.length - 1]).end;
      }

      const total = points.reduce((s, p) => s + p.value, 0);

      // How many paid transactions in this window have NO paid_at set?
      const { count: missingPaidAtCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', windowStart)
        .lt('created_at', windowEnd)
        .eq('status', 'paid')
        .is('paid_at', null);

      return { points, total, missingPaidAtCount: missingPaidAtCount || 0 };
    },
  });
};
