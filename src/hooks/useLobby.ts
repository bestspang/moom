import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getBangkokDayRange } from '@/lib/dateRange';
import { logActivity } from '@/lib/activityLogger';
import type { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type CheckInWithRelations = Tables<'member_attendance'> & {
  member: Tables<'members'> | null;
  member_package: (Tables<'member_packages'> & {
    package: Tables<'packages'> | null;
  }) | null;
  location: Tables<'locations'> | null;
};

export function useCheckIns(date: Date, search: string = '') {
  const { user } = useAuth();
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayRange = getBangkokDayRange(date);
  
  return useQuery({
    queryKey: ['check-ins', dateStr, search],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
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
        .gte('check_in_time', dayRange.start)
        .lt('check_in_time', dayRange.end)
        .order('check_in_time', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      let results = (data ?? []) as unknown as CheckInWithRelations[];

      if (search) {
        const s = search.toLowerCase();
        results = results.filter((item) => {
          const m = item.member;
          if (!m) return false;
          const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
          const nickname = m.nickname?.toLowerCase() || '';
          const memberId = m.member_id?.toLowerCase() || '';
          const phone = m.phone?.toLowerCase() || '';
          const email = m.email?.toLowerCase() || '';
          return fullName.includes(s) || nickname.includes(s) || memberId.includes(s) || phone.includes(s) || email.includes(s);
        });
      }

      return results;
    },
  });
}

export function useCreateCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (checkIn: {
      member_id: string;
      location_id: string | null;
      member_package_id?: string | null;
      check_in_type?: string;
      check_in_time: string;
      checkin_method?: string;
      created_by?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('member_attendance')
        .insert({
          member_id: checkIn.member_id,
          location_id: checkIn.location_id,
          member_package_id: checkIn.member_package_id || null,
          check_in_type: checkIn.check_in_type || 'gym',
          check_in_time: checkIn.check_in_time,
          checkin_method: checkIn.checkin_method || 'manual',
          created_by: checkIn.created_by || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['check-ins'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

      logActivity({
        event_type: 'member_check_in',
        activity: `Member checked in via ${variables.checkin_method || 'manual'}`,
        entity_type: 'member_attendance',
        entity_id: data.id,
        member_id: variables.member_id,
        new_value: {
          location_id: variables.location_id,
          member_package_id: variables.member_package_id,
          checkin_method: variables.checkin_method || 'manual',
        },
      });

      toast.success('Member checked in successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useMembersForCheckIn(search: string = '') {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['members-for-checkin', search],
    enabled: !!user && (search.length >= 2 || search.length === 0),
    queryFn: async () => {
      let query = supabase
        .from('members')
        .select('*')
        .eq('status', 'active')
        .order('first_name', { ascending: true })
        .limit(20);

      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,nickname.ilike.%${search}%,member_id.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useMemberPackages(memberId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['member-packages-for-checkin', memberId],
    enabled: !!user && !!memberId,
    queryFn: async () => {
      if (!memberId) return [];
      
      const { data, error } = await supabase
        .from('member_packages')
        .select(`
          *,
          package:packages(*)
        `)
        .eq('member_id', memberId)
        .in('status', ['ready_to_use', 'active'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

/** Check if a member already checked in at a location today */
export function useCheckDuplicate(memberId: string | null, locationId: string | null, date: Date) {
  const { user } = useAuth();
  const dateStr = format(date, 'yyyy-MM-dd');
  return useQuery({
    queryKey: ['check-in-duplicate', memberId, locationId, dateStr],
    enabled: !!user && !!memberId && !!locationId,
    queryFn: async () => {
      if (!memberId || !locationId) return false;
      const { data, error } = await supabase
        .from('member_attendance')
        .select('id')
        .eq('member_id', memberId)
        .eq('location_id', locationId)
        .gte('check_in_time', `${dateStr}T00:00:00`)
        .lt('check_in_time', `${dateStr}T23:59:59`)
        .limit(1);
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
  });
}
