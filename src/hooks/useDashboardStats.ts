import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDateForDB } from '@/lib/formatters';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardStats {
  checkinsToday: number;
  checkinsYesterday: number;
  currentlyInClass: number;
  classesToday: number;
}

export interface RiskMember {
  id: string;
  name: string;
  phone: string;
  expiryDate: string;
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
      const yesterday = formatDateForDB(new Date(Date.now() - 86400000));

      const { count: checkinsToday } = await supabase
        .from('member_attendance')
        .select('*', { count: 'exact', head: true })
        .gte('check_in_time', `${today}T00:00:00`)
        .lt('check_in_time', `${today}T23:59:59`);

      const { count: checkinsYesterday } = await supabase
        .from('member_attendance')
        .select('*', { count: 'exact', head: true })
        .gte('check_in_time', `${yesterday}T00:00:00`)
        .lt('check_in_time', `${yesterday}T23:59:59`);

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

      return {
        checkinsToday: checkinsToday || 0,
        checkinsYesterday: checkinsYesterday || 0,
        currentlyInClass: currentlyInClass || 0,
        classesToday: classesToday || 0,
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

        let expiryText = '-';
        if (nearestExpiry) {
          const daysLeft = Math.ceil((nearestExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 0) {
            expiryText = 'Expired';
          } else if (daysLeft === 1) {
            expiryText = '1 day';
          } else {
            expiryText = `${daysLeft} days`;
          }
        }

        return {
          id: member.id,
          name: `${member.first_name} ${member.last_name}`,
          phone: member.phone || '-',
          expiryDate: expiryText,
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

