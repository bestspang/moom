import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subMonths, getDay, parseISO } from 'date-fns';

export interface PeakHourCell {
  day: number;   // 0=Sun..6=Sat
  hour: number;  // 6..17
  revenue: number;
  classes: number;
  revenuePerClass: number;
}

/**
 * Calculates revenue per time slot by joining schedule data
 * with transaction data via member_packages.
 * Approximation: distributes package revenue evenly across scheduled classes.
 */
export function usePeakHourRevenue() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['peak-hour-revenue'],
    enabled: !!user,
    queryFn: async (): Promise<PeakHourCell[]> => {
      const now = new Date();
      const thirtyDaysAgo = format(subMonths(now, 1), 'yyyy-MM-dd');

      // Get schedule data with booking counts
      const { data: schedData, error } = await supabase
        .from('schedule')
        .select('scheduled_date, start_time, checked_in, capacity')
        .gte('scheduled_date', thirtyDaysAgo)
        .neq('status', 'cancelled');

      if (error) throw error;

      // Get revenue in same period
      const { data: revData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('status', 'paid')
        .gte('created_at', thirtyDaysAgo);

      const totalRevenue = (revData || []).reduce((s, t) => s + Number(t.amount || 0), 0);
      const totalCheckins = (schedData || []).reduce((s, c) => s + (c.checked_in || 0), 0);
      const revenuePerCheckin = totalCheckins > 0 ? totalRevenue / totalCheckins : 0;

      // Build grid
      const grid: PeakHourCell[] = [];
      for (let d = 0; d < 7; d++) {
        for (let h = 6; h < 18; h++) {
          grid.push({ day: d, hour: h, revenue: 0, classes: 0, revenuePerClass: 0 });
        }
      }

      (schedData || []).forEach((s) => {
        const dayOfWeek = getDay(parseISO(s.scheduled_date));
        const hour = parseInt(s.start_time.split(':')[0], 10);
        if (hour < 6 || hour >= 18) return;
        const cell = grid.find((c) => c.day === dayOfWeek && c.hour === hour);
        if (cell) {
          cell.classes++;
          cell.revenue += (s.checked_in || 0) * revenuePerCheckin;
        }
      });

      grid.forEach((c) => {
        c.revenuePerClass = c.classes > 0 ? Math.round(c.revenue / c.classes) : 0;
        c.revenue = Math.round(c.revenue);
      });

      return grid;
    },
    staleTime: 15 * 60 * 1000,
  });
}
