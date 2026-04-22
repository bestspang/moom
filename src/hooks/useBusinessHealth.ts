import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/contexts/AuthContext';

export interface BusinessHealthData {
  score: number;
  trend: 'up' | 'down' | 'stable';
  components: {
    retention: number;    // 0-100
    revenueTrend: number; // 0-100
    classUtilization: number; // 0-100
    leadConversion: number;   // 0-100
  };
}

export function useBusinessHealth() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.businessHealth(),
    enabled: !!user,
    queryFn: async (): Promise<BusinessHealthData> => {
      const now = new Date();
      const thisMonthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const thisMonthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
      const lastMonthStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
      const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');

      // 1. Retention: active member packages / all non-new member packages (last 90 days)
      const [activeRes, totalPkgRes] = await Promise.all([
        supabase
          .from('member_packages')
          .select('*', { count: 'exact', head: true })
          .in('status', ['active', 'ready_to_use']),
        supabase
          .from('member_packages')
          .select('*', { count: 'exact', head: true }),
      ]);
      const activePkgs = activeRes.count || 0;
      const totalPkgs = totalPkgRes.count || 1;
      const retention = Math.min(100, Math.round((activePkgs / totalPkgs) * 100));

      // 2. Revenue trend: this month vs last month
      const [thisMonthRes, lastMonthRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('amount')
          .eq('status', 'paid')
          .gte('created_at', thisMonthStart)
          .lte('created_at', thisMonthEnd),
        supabase
          .from('transactions')
          .select('amount')
          .eq('status', 'paid')
          .gte('created_at', lastMonthStart)
          .lte('created_at', lastMonthEnd),
      ]);
      const thisRevenue = (thisMonthRes.data || []).reduce((s, t) => s + Number(t.amount || 0), 0);
      const lastRevenue = (lastMonthRes.data || []).reduce((s, t) => s + Number(t.amount || 0), 0);
      // Score: 50 if flat, +/- based on growth rate, capped 0-100
      let revenueTrend = 50;
      if (lastRevenue > 0) {
        const growthRate = (thisRevenue - lastRevenue) / lastRevenue;
        revenueTrend = Math.max(0, Math.min(100, Math.round(50 + growthRate * 100)));
      } else if (thisRevenue > 0) {
        revenueTrend = 80;
      }

      // 3. Class utilization: avg(checked_in / capacity) for recent 30 days
      const thirtyDaysAgo = format(subMonths(now, 1), 'yyyy-MM-dd');
      const { data: scheduleData } = await supabase
        .from('schedule')
        .select('checked_in, capacity')
        .gte('scheduled_date', thirtyDaysAgo)
        .neq('status', 'cancelled');

      let classUtilization = 0;
      if (scheduleData && scheduleData.length > 0) {
        const total = scheduleData.reduce((sum, s) => {
          if (s.capacity && s.capacity > 0) {
            return sum + (s.checked_in || 0) / s.capacity;
          }
          return sum;
        }, 0);
        classUtilization = Math.round((total / scheduleData.length) * 100);
      }

      // 4. Lead conversion rate
      const { data: leadsData } = await supabase
        .from('leads')
        .select('status');
      const totalLeads = leadsData?.length || 1;
      const convertedLeads = leadsData?.filter(l => l.status === 'converted').length || 0;
      const leadConversion = Math.round((convertedLeads / totalLeads) * 100);

      // Composite score: weighted average
      const score = Math.round(
        retention * 0.35 +
        revenueTrend * 0.30 +
        classUtilization * 0.20 +
        leadConversion * 0.15
      );

      // Trend: compare this vs last month revenue as simple signal
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (thisRevenue > lastRevenue * 1.05) trend = 'up';
      else if (thisRevenue < lastRevenue * 0.95) trend = 'down';

      return {
        score: Math.max(0, Math.min(100, score)),
        trend,
        components: {
          retention,
          revenueTrend,
          classUtilization,
          leadConversion,
        },
      };
    },
    staleTime: 15 * 60 * 1000,
  });
}
