import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subMonths, startOfMonth, endOfMonth, format, getDay, getHours, parseISO } from 'date-fns';

// Revenue by month (last 6 months)
export function useRevenueByMonth() {
  return useQuery({
    queryKey: ['analytics-revenue-by-month'],
    queryFn: async () => {
      const now = new Date();
      const sixMonthsAgo = format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('transactions')
        .select('amount, created_at')
        .eq('status', 'paid')
        .gte('created_at', sixMonthsAgo)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const monthMap = new Map<string, number>();
      for (let i = 5; i >= 0; i--) {
        const key = format(subMonths(now, i), 'yyyy-MM');
        monthMap.set(key, 0);
      }

      (data || []).forEach((tx) => {
        const key = format(new Date(tx.created_at!), 'yyyy-MM');
        if (monthMap.has(key)) {
          monthMap.set(key, (monthMap.get(key) || 0) + Number(tx.amount));
        }
      });

      return Array.from(monthMap.entries()).map(([month, revenue]) => ({
        month,
        label: format(parseISO(month + '-01'), 'MMM'),
        revenue,
      }));
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Member growth by month (last 6 months)
export function useMemberGrowth() {
  return useQuery({
    queryKey: ['analytics-member-growth'],
    queryFn: async () => {
      const now = new Date();
      const sixMonthsAgo = format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd');

      const [membersRes, expiredRes] = await Promise.all([
        supabase
          .from('members')
          .select('created_at')
          .gte('created_at', sixMonthsAgo),
        supabase
          .from('member_packages')
          .select('expiry_date')
          .eq('status', 'expired')
          .gte('expiry_date', sixMonthsAgo),
      ]);

      if (membersRes.error) throw membersRes.error;
      if (expiredRes.error) throw expiredRes.error;

      const months: { month: string; label: string; newMembers: number; expired: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const key = format(subMonths(now, i), 'yyyy-MM');
        months.push({ month: key, label: format(parseISO(key + '-01'), 'MMM'), newMembers: 0, expired: 0 });
      }

      const monthKeys = new Set(months.map((m) => m.month));

      (membersRes.data || []).forEach((m) => {
        const key = format(new Date(m.created_at!), 'yyyy-MM');
        if (monthKeys.has(key)) {
          const entry = months.find((e) => e.month === key);
          if (entry) entry.newMembers++;
        }
      });

      (expiredRes.data || []).forEach((p) => {
        if (!p.expiry_date) return;
        const key = format(new Date(p.expiry_date), 'yyyy-MM');
        if (monthKeys.has(key)) {
          const entry = months.find((e) => e.month === key);
          if (entry) entry.expired++;
        }
      });

      return months;
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Class fill rate heatmap — day of week × hour
export function useClassFillRate() {
  return useQuery({
    queryKey: ['analytics-class-fill-rate'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule')
        .select('scheduled_date, start_time, checked_in, capacity')
        .neq('status', 'cancelled');

      if (error) throw error;

      // Grid: 7 days × 12 hours (6am–6pm)
      const grid: { day: number; hour: number; totalRate: number; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        for (let h = 6; h < 18; h++) {
          grid.push({ day: d, hour: h, totalRate: 0, count: 0 });
        }
      }

      (data || []).forEach((s) => {
        const dayOfWeek = getDay(parseISO(s.scheduled_date));
        const hour = parseInt(s.start_time.split(':')[0], 10);
        if (hour < 6 || hour >= 18) return;
        const cell = grid.find((c) => c.day === dayOfWeek && c.hour === hour);
        if (cell && s.capacity && s.capacity > 0) {
          cell.totalRate += (s.checked_in || 0) / s.capacity;
          cell.count++;
        }
      });

      return grid.map((c) => ({
        day: c.day,
        hour: c.hour,
        fillRate: c.count > 0 ? Math.round((c.totalRate / c.count) * 100) : 0,
      }));
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Lead conversion funnel
export function useLeadFunnel() {
  return useQuery({
    queryKey: ['analytics-lead-funnel'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('status');

      if (error) throw error;

      const counts: Record<string, number> = {
        new: 0,
        contacted: 0,
        interested: 0,
        converted: 0,
      };

      (data || []).forEach((l) => {
        const s = l.status || 'new';
        if (s in counts) counts[s]++;
      });

      const stages = [
        { stage: 'New', key: 'new', count: counts.new },
        { stage: 'Contacted', key: 'contacted', count: counts.contacted },
        { stage: 'Interested', key: 'interested', count: counts.interested },
        { stage: 'Converted', key: 'converted', count: counts.converted },
      ];

      const max = Math.max(...stages.map((s) => s.count), 1);
      return stages.map((s) => ({ ...s, percent: Math.round((s.count / max) * 100) }));
    },
    staleTime: 10 * 60 * 1000,
  });
}
