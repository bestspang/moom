import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { logActivity } from '@/lib/activityLogger';
import { queryKeys } from '@/lib/queryKeys';

interface LineUser {
  id: string;
  user_id: string | null;
  member_id: string | null;
  line_user_id: string;
  line_display_name: string | null;
  line_picture_url: string | null;
  line_id_token: string | null;
  linked_at: string;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

// Fetch LINE user by LINE user ID
export const useLineUser = (lineUserId: string) => {
  return useQuery({
    queryKey: queryKeys.lineUser(lineUserId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('line_users')
        .select(`
          *,
          members(id, first_name, last_name, nickname, member_id, avatar_url)
        `)
        .eq('line_user_id', lineUserId)
        .single();

      if (error) throw error;
      return data as LineUser & { members: unknown };
    },
    enabled: !!lineUserId,
  });
};

// Fetch LINE link for a member
export const useMemberLineLink = (memberId: string) => {
  return useQuery({
    queryKey: queryKeys.memberLineLink(memberId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('line_users')
        .select('*')
        .eq('member_id', memberId)
        .maybeSingle();

      if (error) throw error;
      return data as LineUser | null;
    },
    enabled: !!memberId,
  });
};

// Fetch all LINE users (for admin)
export const useLineUsers = () => {
  return useQuery({
    queryKey: queryKeys.lineUsers(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('line_users')
        .select(`
          *,
          members(id, first_name, last_name, nickname, member_id, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Link a LINE account to a member
export const useLinkLineAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      lineUserId,
      lineDisplayName,
      linePictureUrl,
      lineIdToken,
      userId,
    }: {
      memberId: string;
      lineUserId: string;
      lineDisplayName?: string;
      linePictureUrl?: string;
      lineIdToken?: string;
      userId?: string;
    }) => {
      // Check if LINE user ID is already linked
      const { data: existing, error: checkError } = await supabase
        .from('line_users')
        .select('id, member_id')
        .eq('line_user_id', lineUserId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        if (existing.member_id === memberId) {
          // Already linked to this member, just update
          const { data, error } = await supabase
            .from('line_users')
            .update({
              line_display_name: lineDisplayName || null,
              line_picture_url: linePictureUrl || null,
              line_id_token: lineIdToken || null,
              last_login_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (error) throw error;
          return data;
        } else {
          throw new Error('This LINE account is already linked to another member');
        }
      }

      // Check if member already has a LINE link
      const { data: memberLink, error: memberCheckError } = await supabase
        .from('line_users')
        .select('id')
        .eq('member_id', memberId)
        .maybeSingle();

      if (memberCheckError) throw memberCheckError;

      if (memberLink) {
        // Update existing link
        const { data, error } = await supabase
          .from('line_users')
          .update({
            line_user_id: lineUserId,
            line_display_name: lineDisplayName || null,
            line_picture_url: linePictureUrl || null,
            line_id_token: lineIdToken || null,
            linked_at: new Date().toISOString(),
            last_login_at: new Date().toISOString(),
          })
          .eq('id', memberLink.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      // Create new link
      const { data, error } = await supabase
        .from('line_users')
        .insert({
          member_id: memberId,
          user_id: userId || null,
          line_user_id: lineUserId,
          line_display_name: lineDisplayName || null,
          line_picture_url: linePictureUrl || null,
          line_id_token: lineIdToken || null,
          linked_at: new Date().toISOString(),
          last_login_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as LineUser;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lineUser(variables.lineUserId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.memberLineLink(variables.memberId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lineUsers() });
      logActivity({
        event_type: 'line_account_linked',
        activity: `LINE account linked to member`,
        entity_type: 'member',
        entity_id: variables.memberId,
        member_id: variables.memberId,
      });
      toast.success(i18n.t('toast.lineLinked'));
    },
    onError: (error: Error) => {
      toast.error(error.message || i18n.t('toast.lineLinkFailed'));
      console.error('Link LINE account error:', error);
    },
  });
};

// Unlink a LINE account from a member
export const useUnlinkLineAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
    }: {
      memberId: string;
    }) => {
      const { error } = await supabase
        .from('line_users')
        .delete()
        .eq('member_id', memberId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.memberLineLink(variables.memberId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lineUsers() });
      logActivity({
        event_type: 'line_account_unlinked',
        activity: `LINE account unlinked from member`,
        entity_type: 'member',
        entity_id: variables.memberId,
        member_id: variables.memberId,
      });
      toast.success(i18n.t('toast.lineUnlinked'));
    },
    onError: (error) => {
      toast.error(i18n.t('toast.lineUnlinkFailed'));
      console.error('Unlink LINE account error:', error);
    },
  });
};

// Update LINE user's last login
export const useUpdateLineLastLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lineUserId,
    }: {
      lineUserId: string;
    }) => {
      const { data, error } = await supabase
        .from('line_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('line_user_id', lineUserId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lineUser(variables.lineUserId) });
      logActivity({
        event_type: 'line_last_login_updated',
        activity: `LINE user last login updated`,
        entity_type: 'line_user',
      });
    },
  });
};

// Update LINE profile info
export const useUpdateLineProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lineUserId,
      displayName,
      pictureUrl,
    }: {
      lineUserId: string;
      displayName?: string;
      pictureUrl?: string;
    }) => {
      const updates: Partial<LineUser> = {};
      if (displayName !== undefined) updates.line_display_name = displayName;
      if (pictureUrl !== undefined) updates.line_picture_url = pictureUrl;

      const { data, error } = await supabase
        .from('line_users')
        .update(updates)
        .eq('line_user_id', lineUserId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lineUser(variables.lineUserId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lineUsers() });
      logActivity({
        event_type: 'line_profile_updated',
        activity: `LINE user profile updated`,
        entity_type: 'line_user',
      });
    },
    onError: (error) => {
      console.error('Update LINE profile error:', error);
    },
  });
};

// Search LINE users
export const useSearchLineUsers = (searchTerm: string) => {
  return useQuery({
    queryKey: queryKeys.searchLineUsers(searchTerm),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('line_users')
        .select(`
          *,
          members(id, first_name, last_name, nickname, member_id, avatar_url)
        `)
        .or(`line_display_name.ilike.%${searchTerm}%,line_user_id.ilike.%${searchTerm}%`);

      if (error) throw error;
      return data;
    },
    enabled: searchTerm.length >= 2,
  });
};

// Get LINE user statistics
export const useLineUserStats = () => {
  return useQuery({
    queryKey: queryKeys.lineUserStats(),
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('line_users')
        .select('*', { count: 'exact' });

      if (error) throw error;

      const linkedToMembers = data?.filter((u) => u.member_id).length || 0;
      const activeLastWeek = data?.filter((u) => {
        if (!u.last_login_at) return false;
        const lastLogin = new Date(u.last_login_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return lastLogin > weekAgo;
      }).length || 0;

      return {
        total: count || 0,
        linkedToMembers,
        notLinked: (count || 0) - linkedToMembers,
        activeLastWeek,
      };
    },
  });
};
