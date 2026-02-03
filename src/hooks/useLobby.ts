import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type CheckInWithRelations = Tables<'member_attendance'> & {
  member: Tables<'members'> | null;
  member_package: (Tables<'member_packages'> & {
    package: Tables<'packages'> | null;
  }) | null;
  location: Tables<'locations'> | null;
};

export function useCheckIns(date: Date, search: string = '') {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['check-ins', dateStr, search],
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
        .gte('check_in_time', `${dateStr}T00:00:00`)
        .lt('check_in_time', `${dateStr}T23:59:59`)
        .order('check_in_time', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      let results = data as CheckInWithRelations[];

      // Filter by search on client side (member name search)
      if (search) {
        const searchLower = search.toLowerCase();
        results = results.filter((item) => {
          const member = item.member;
          if (!member) return false;
          const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
          const nickname = member.nickname?.toLowerCase() || '';
          return fullName.includes(searchLower) || nickname.includes(searchLower);
        });
      }

      return results;
    },
  });
}

export function useCreateCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (checkIn: TablesInsert<'member_attendance'>) => {
      const { data, error } = await supabase
        .from('member_attendance')
        .insert(checkIn)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['check-ins'] });
      toast({
        title: 'Success',
        description: 'Member checked in successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useMembersForCheckIn(search: string = '') {
  return useQuery({
    queryKey: ['members-for-checkin', search],
    queryFn: async () => {
      let query = supabase
        .from('members')
        .select('*')
        .eq('status', 'active')
        .order('first_name', { ascending: true })
        .limit(20);

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,nickname.ilike.%${search}%,member_id.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: search.length >= 2 || search.length === 0,
  });
}

export function useMemberPackages(memberId: string | null) {
  return useQuery({
    queryKey: ['member-packages-for-checkin', memberId],
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
    enabled: !!memberId,
  });
}
