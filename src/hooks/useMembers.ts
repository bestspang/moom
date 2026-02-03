import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Member = Database['public']['Tables']['members']['Row'];
type MemberInsert = Database['public']['Tables']['members']['Insert'];
type MemberUpdate = Database['public']['Tables']['members']['Update'];
type MemberStatus = Database['public']['Enums']['member_status'];

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
  return useQuery({
    queryKey: ['members', { status, search, page, perPage }],
    queryFn: async () => {
      let query = supabase
        .from('members')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Filter by status
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      // Search filter
      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,nickname.ilike.%${search}%,member_id.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      // Pagination
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      return {
        members: data || [],
        total: count || 0,
        page,
        perPage,
      };
    },
  });
};

export const useMember = (id: string) => {
  return useQuery({
    queryKey: ['member', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useMemberStats = () => {
  return useQuery({
    queryKey: ['member-stats'],
    queryFn: async (): Promise<MemberStats> => {
      const { data, error } = await supabase
        .from('members')
        .select('status');

      if (error) throw error;

      const stats: MemberStats = {
        active: 0,
        suspended: 0,
        on_hold: 0,
        inactive: 0,
        total: 0,
      };

      (data || []).forEach((member) => {
        stats.total++;
        if (member.status) {
          stats[member.status]++;
        }
      });

      return stats;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member-stats'] });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['member-stats'] });
    },
  });
};

export const useDeleteMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member-stats'] });
    },
  });
};

// Generate next member ID
export const useNextMemberId = () => {
  return useQuery({
    queryKey: ['next-member-id'],
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
    staleTime: 0, // Always refetch
  });
};
