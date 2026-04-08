import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDateForDB } from '@/lib/formatters';
import { getBangkokDayRange } from '@/lib/dateRange';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardStats {
  checkinsToday: number;
  checkinsYesterday: number;
  checkinsLastWeekSameDay: number;
  currentlyInClass: number;
  classesToday: number;
  todayRevenue: number;
  revenueLastWeekSameDay: number;
  activeMembers: number;
}

export interface RiskMember {
  id: string;
  name: string;
  phone: string;
  daysLeft: number | null;
}

export interface HotLead {
  id: string;
  name: string;
  status: string;
}

export interface UpcomingBirthday {
  id: string;
  name: string;
  date: string;
}


export const useDashboardStats = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.dashboardStats(),
    enabled: !!user,
    queryFn: async (): Promise<DashboardStats> => {
      const today = formatDateForDB(new Date());
      const todayRange = getBangkokDayRange(new Date());
      const yesterdayRange = getBangkokDayRange(new Date(Date.now() - 86400000));
      const lastWeekSameDayRange = getBangkokDayRange(new Date(Date.now() - 7 * 86400000));

      const { count: checkinsToday } = await supabase
        .from('member_attendance')
        .select('*', { count: 'exact', head: true })
        .gte('check_in_time', todayRange.start)
        .lt('check_in_time', todayRange.end);

      const { count: checkinsYesterday } = await supabase
        .from('member_attendance')
        .select('*', { count: 'exact', head: true })
        .gte('check_in_time', yesterdayRange.start)
        .lt('check_in_time', yesterdayRange.end);

      // Same day last week — for "vs last {dayName}" comparison
      const { count: checkinsLastWeekSameDay } = await supabase
        .from('member_attendance')
        .select('*', { count: 'exact', head: true })
        .gte('check_in_time', lastWeekSameDayRange.start)
        .lt('check_in_time', lastWeekSameDayRange.end);

      const { count: classesToday } = await supabase
        .from('schedule')
        .select('*', { count: 'exact', head: true })
        .eq('scheduled_date', today)
        .eq('status', 'scheduled');

      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { count: currentlyInClass } = await supabase
        .from('member_attendance')
        .select('*', { count: 'exact', head: true })
        .gte('check_in_time', twoHoursAgo)
        .not('schedule_id', 'is', null);

      // Today's revenue — sum of paid transactions today
      const { data: revenueData } = await supabase
        .from('transactions')
        .select('amount')
        .gte('created_at', todayRange.start)
        .lt('created_at', todayRange.end)
        .eq('status', 'paid');
      const todayRevenue = (revenueData || []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      // Revenue same day last week
      const { data: revLastWeekData } = await supabase
        .from('transactions')
        .select('amount')
        .gte('created_at', lastWeekSameDayRange.start)
        .lt('created_at', lastWeekSameDayRange.end)
        .eq('status', 'paid');
      const revenueLastWeekSameDay = (revLastWeekData || []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      // Active members count
      const { count: activeMembers } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      return {
        checkinsToday: checkinsToday || 0,
        checkinsYesterday: checkinsYesterday || 0,
        checkinsLastWeekSameDay: checkinsLastWeekSameDay || 0,
        currentlyInClass: currentlyInClass || 0,
        classesToday: classesToday || 0,
        todayRevenue,
        revenueLastWeekSameDay,
        activeMembers: activeMembers || 0,
      };
    },
  });
};

export const useHighRiskMembers = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.highRiskMembers(),
    enabled: !!user,
    queryFn: async (): Promise<RiskMember[]> => {
      const { data, error } = await supabase
        .from('members')
        .select(`
          id, 
          first_name, 
          last_name, 
          phone,
          member_packages!inner (
            expiry_date,
            status
          )
        `)
        .eq('risk_level', 'high')
        .eq('status', 'active')
        .eq('member_packages.status', 'active')
        .limit(5);

      if (error) throw error;

      const today = new Date();

      return (data || []).map((member) => {
        const packages = member.member_packages as Array<{ expiry_date: string | null; status: string }>;
        let nearestExpiry: Date | null = null;

        packages.forEach((pkg) => {
          if (pkg.expiry_date) {
            const expiryDate = new Date(pkg.expiry_date);
            if (!nearestExpiry || expiryDate < nearestExpiry) {
              nearestExpiry = expiryDate;
            }
          }
        });

        let daysLeft: number | null = null;
        if (nearestExpiry) {
          daysLeft = Math.ceil((nearestExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        }

        return {
          id: member.id,
          name: `${member.first_name} ${member.last_name}`,
          phone: member.phone || '-',
          daysLeft,
        };
      });
    },
  });
};

export const useHotLeads = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.hotLeads(),
    enabled: !!user,
    queryFn: async (): Promise<HotLead[]> => {
      const { data, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, status')
        .eq('status', 'interested')
        .limit(5);

      if (error) throw error;

      return (data || []).map((lead) => ({
        id: lead.id,
        name: `${lead.first_name} ${lead.last_name || ''}`.trim(),
        status: lead.status || 'new',
      }));
    },
  });
};

export const useUpcomingBirthdays = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.upcomingBirthdays(),
    enabled: !!user,
    queryFn: async (): Promise<UpcomingBirthday[]> => {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, date_of_birth')
        .not('date_of_birth', 'is', null)
        .eq('status', 'active')
        .limit(100);

      if (error) throw error;

      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      return (data || [])
        .filter((member) => {
          if (!member.date_of_birth) return false;
          const dob = new Date(member.date_of_birth);
          const thisYearBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
          return thisYearBday >= today && thisYearBday <= nextWeek;
        })
        .map((member) => {
          const dob = new Date(member.date_of_birth!);
          return {
            id: member.id,
            name: `${member.first_name} ${member.last_name}`,
            date: `${dob.getDate()} ${dob.toLocaleString('en', { month: 'short' }).toUpperCase()}`,
          };
        })
        .slice(0, 5);
    },
  });
};

