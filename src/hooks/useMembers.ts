import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { queryKeys } from '@/lib/queryKeys';
import { logActivity } from '@/lib/activityLogger';
import { useAuth } from '@/contexts/AuthContext';

type Member = Database['public']['Tables']['members']['Row'];
type MemberInsert = Database['public']['Tables']['members']['Insert'];
type MemberUpdate = Database['public']['Tables']['members']['Update'];
type MemberStatus = Database['public']['Enums']['member_status'];

// Member with joined location name
export interface MemberWithLocation extends Member {
  register_location?: { id: string; name: string } | null;
}

interface UseMembersParams {
  status?: MemberStatus | 'all';
  search?: string;
  page?: number;
  perPage?: number;
}

interface MemberStats {
  active: number;
  suspended: number;
  on_hold: number;
  inactive: number;
  total: number;
}

export const useMembers = ({ status = 'all', search = '', page = 1, perPage = 50 }: UseMembersParams = {}) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.members({ status, search, page, perPage }),
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from('members')
        .select('*, register_location:locations!members_register_location_id_fkey(id, name)', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,nickname.ilike.%${search}%,member_id.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      return {
        members: (data || []) as MemberWithLocation[],
        total: count || 0,
        page,
        perPage,
      };
    },
  });
};

export const useMember = (id: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.member(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*, register_location:locations!members_register_location_id_fkey(id, name)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as MemberWithLocation;
    },
    enabled: !!user && !!id,
  });
};

export const useMemberStats = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.memberStats(),
    enabled: !!user,
    queryFn: async (): Promise<MemberStats> => {
      const [activeRes, suspendedRes, onHoldRes, inactiveRes, totalRes] = await Promise.all([
        supabase.from('members').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('members').select('id', { count: 'exact', head: true }).eq('status', 'suspended'),
        supabase.from('members').select('id', { count: 'exact', head: true }).eq('status', 'on_hold'),
        supabase.from('members').select('id', { count: 'exact', head: true }).eq('status', 'inactive'),
        supabase.from('members').select('id', { count: 'exact', head: true }),
      ]);

      for (const res of [activeRes, suspendedRes, onHoldRes, inactiveRes, totalRes]) {
        if (res.error) throw res.error;
      }

      return {
        active: activeRes.count ?? 0,
        suspended: suspendedRes.count ?? 0,
        on_hold: onHoldRes.count ?? 0,
        inactive: inactiveRes.count ?? 0,
        total: totalRes.count ?? 0,
      };
    },
  });
};

export const useCreateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (member: MemberInsert) => {
      const { data, error } = await supabase
        .from('members')
        .insert(member)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member-stats'] });
      logActivity({
        event_type: 'member_created',
        activity: `Member ${data.first_name} ${data.last_name} created`,
        entity_type: 'member',
        entity_id: data.id,
        member_id: data.id,
      });
    },
  });
};

export const useUpdateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MemberUpdate }) => {
      const { data: result, error } = await supabase
        .from('members')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['member-stats'] });
      logActivity({
        event_type: 'member_updated',
        activity: `Member ${result.first_name} ${result.last_name} updated`,
        entity_type: 'member',
        entity_id: variables.id,
        member_id: variables.id,
        new_value: variables.data as Record<string, unknown>,
      });
    },
  });
};

export const useDeleteMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('delete_member_cascade', { p_member_id: id });
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member-stats'] });
      logActivity({
        event_type: 'member_deleted',
        activity: `Member deleted`,
        entity_type: 'member',
        entity_id: id,
      });
    },
  });
};

export const useBulkDeleteMembers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('members')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member-stats'] });
      logActivity({
        event_type: 'member_bulk_deleted',
        activity: `${ids.length} members deleted in bulk`,
        entity_type: 'member',
      });
    },
  });
};

export const useBulkUpdateMemberStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: MemberStatus }) => {
      const { error } = await supabase
        .from('members')
        .update({ status })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, { ids, status }) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member-stats'] });
      logActivity({
        event_type: 'member_bulk_status_changed',
        activity: `${ids.length} members status changed to ${status}`,
        entity_type: 'member',
        new_value: { status },
      });
    },
  });
};

// Generate next member ID
export const useNextMemberId = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['next-member-id'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('member_id')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        return 'M-0000001';
      }

      const lastId = data[0].member_id;
      const numPart = parseInt(lastId.replace('M-', ''), 10);
      const nextNum = numPart + 1;
      return `M-${nextNum.toString().padStart(7, '0')}`;
    },
    staleTime: 0,
  });
};
