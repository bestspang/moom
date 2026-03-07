import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { getBangkokDayRange } from '@/lib/dateRange';
import { queryKeys } from '@/lib/queryKeys';
import type { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type GymCheckinRow = Tables<'member_attendance'> & {
  member: Tables<'members'> | null;
  member_package: (Tables<'member_packages'> & {
    package: Tables<'packages'> | null;
  }) | null;
  location: Tables<'locations'> | null;
};

export interface GymCheckinItem {
  id: string;
  time: string;
  name: string;
  phone: string;
  packageName: string;
  location: string;
  checkInType: string;
}

function mapToItem(row: GymCheckinRow): GymCheckinItem {
  const member = row.member;
  const pkg = row.member_package?.package;
  return {
    id: row.id,
    time: row.check_in_time
      ? format(new Date(row.check_in_time), 'HH:mm')
      : '-',
    name: member
      ? `${member.first_name} ${member.last_name}`.trim()
      : '-',
    phone: member?.phone || '-',
    packageName: pkg?.name_en || '-',
    location: row.location?.name || '-',
    checkInType: row.check_in_type || '-',
  };
}

export function useGymCheckinsByDate(date: Date, search: string = '') {
  const dateStr = format(date, 'yyyy-MM-dd');

  return useQuery({
    queryKey: queryKeys.gymCheckins(dateStr, search),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_attendance')
        .select(`
          *,
          member:members(*),
          member_package:member_packages(
            *,
            package:packages(*)
          ),
          location:locations(*)
        `)
        .is('schedule_id', null)
        .gte('check_in_time', `${dateStr}T00:00:00`)
        .lt('check_in_time', `${dateStr}T23:59:59`)
        .order('check_in_time', { ascending: false })
        .limit(200);

      if (error) throw error;

      let results = (data as GymCheckinRow[]).map(mapToItem);

      // Client-side search filter
      if (search && search.length >= 2) {
        const q = search.toLowerCase();
        results = results.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.phone.includes(q)
        );
      }

      return results;
    },
  });
}
