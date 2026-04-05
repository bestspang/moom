import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format, differenceInMonths } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

export interface InsightsOverview {
  arpu: number;
  retentionRate: number;
  churnRate: number;
  ltv: number;
  classUtilization: number;
  leadConversionRate: number;
  activeMembers: number;
  totalRevenue: number;
  rpv: number;
  totalCheckins: number;
}

export function useInsightsOverview() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['insights-overview'],
    enabled: !!user,
    queryFn: async (): Promise<InsightsOverview> => {
      const now = new Date();
      const thisMonthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const thisMonthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

      // Active members count
      const { count: activeMembers } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // This month revenue
      const { data: revData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('status', 'paid')
        .gte('created_at', thisMonthStart)
        .lte('created_at', thisMonthEnd);

      const totalRevenue = (revData || []).reduce((s, t) => s + Number(t.amount || 0), 0);

      // ARPU
      const memberCount = activeMembers || 1;
      const arpu = Math.round(totalRevenue / memberCount);

      // Retention: active packages / (active + expired in last 90 days)
      const ninetyDaysAgo = format(subMonths(now, 3), 'yyyy-MM-dd');
      const [activeRes, expiredRes] = await Promise.all([
        supabase.from('member_packages').select('*', { count: 'exact', head: true }).in('status', ['active', 'ready_to_use']),
        supabase.from('member_packages').select('*', { count: 'exact', head: true }).eq('status', 'expired').gte('expiry_date', ninetyDaysAgo),
      ]);
      const activePkgs = activeRes.count || 0;
      const expiredPkgs = expiredRes.count || 0;
      const eligible = activePkgs + expiredPkgs || 1;
      const retentionRate = Math.round((activePkgs / eligible) * 100);
      const churnRate = 100 - retentionRate;

      // LTV: ARPU × avg membership duration in months
      const { data: memberDates } = await supabase
        .from('members')
        .select('member_since')
        .eq('status', 'active')
        .not('member_since', 'is', null)
        .limit(500);

      let avgMonths = 6; // default
      if (memberDates && memberDates.length > 0) {
        const totalMonths = memberDates.reduce((sum, m) => {
          return sum + differenceInMonths(now, new Date(m.member_since!));
        }, 0);
        avgMonths = Math.max(1, Math.round(totalMonths / memberDates.length));
      }
      const ltv = arpu * avgMonths;

      // Class utilization (last 30 days)
      const thirtyDaysAgo = format(subMonths(now, 1), 'yyyy-MM-dd');
      const { data: schedData } = await supabase
        .from('schedule')
        .select('checked_in, capacity')
        .gte('scheduled_date', thirtyDaysAgo)
        .neq('status', 'cancelled');

      let classUtilization = 0;
      let totalCheckins = 0;
      if (schedData && schedData.length > 0) {
        const total = schedData.reduce((sum, s) => {
          totalCheckins += (s.checked_in || 0);
          if (s.capacity && s.capacity > 0) return sum + (s.checked_in || 0) / s.capacity;
          return sum;
        }, 0);
        classUtilization = Math.round((total / schedData.length) * 100);
      }

      // RPV (Revenue Per Visit)
      const rpv = totalCheckins > 0 ? Math.round(totalRevenue / totalCheckins) : 0;

      // Lead conversion
      const { data: leadsData } = await supabase.from('leads').select('status');
      const totalLeads = leadsData?.length || 1;
      const converted = leadsData?.filter(l => l.status === 'converted').length || 0;
      const leadConversionRate = Math.round((converted / totalLeads) * 100);

      return {
        arpu,
        retentionRate,
        churnRate,
        ltv,
        classUtilization,
        leadConversionRate,
        activeMembers: activeMembers || 0,
        totalRevenue,
        rpv,
        totalCheckins,
      };
    },
    staleTime: 15 * 60 * 1000,
  });
}

// Daily revenue for sparkline (last 30 days)
export function useRevenueDaily() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['revenue-daily-30d'],
    enabled: !!user,
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = format(subMonths(now, 1), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('transactions')
        .select('amount, created_at')
        .eq('status', 'paid')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const dayMap = new Map<string, number>();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dayMap.set(format(d, 'yyyy-MM-dd'), 0);
      }

      (data || []).forEach((tx) => {
        const key = format(new Date(tx.created_at!), 'yyyy-MM-dd');
        if (dayMap.has(key)) {
          dayMap.set(key, (dayMap.get(key) || 0) + Number(tx.amount || 0));
        }
      });

      return Array.from(dayMap.entries()).map(([date, amount]) => ({
        date,
        label: format(new Date(date), 'dd'),
        amount,
      }));
    },
    staleTime: 10 * 60 * 1000,
  });
}
