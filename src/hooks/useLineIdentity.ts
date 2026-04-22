import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { logActivity } from '@/lib/activityLogger';
import { queryKeys } from '@/lib/queryKeys';

type OwnerType = 'member' | 'lead' | 'staff';

const ownerColumn = (ownerType: OwnerType) => {
  switch (ownerType) {
    case 'member': return 'member_id';
    case 'lead': return 'lead_id';
    case 'staff': return 'staff_id';
  }
};

export interface LineIdentity {
  id: string;
  line_user_id: string;
  line_display_name: string | null;
  line_picture_url: string | null;
  status: string | null;
  linked_at: string | null;
  member_id: string | null;
  lead_id: string | null;
  staff_id: string | null;
}

export const useLineIdentity = (ownerType: OwnerType, ownerId: string | undefined) => {
  const col = ownerColumn(ownerType);
  return useQuery({
    queryKey: queryKeys.lineIdentity(ownerType, ownerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('line_users')
        .select('id, line_user_id, line_display_name, line_picture_url, status, linked_at, member_id, lead_id, staff_id')
        .eq(col, ownerId!)
        .maybeSingle();

      if (error) throw error;
      return data as LineIdentity | null;
    },
    enabled: !!ownerId,
  });
};

export const useRequestLineLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ownerType, ownerId }: { ownerType: OwnerType; ownerId: string }) => {
      const col = ownerColumn(ownerType);

      // Check if already exists
      const { data: existing } = await supabase
        .from('line_users')
        .select('id')
        .eq(col, ownerId)
        .maybeSingle();

      if (existing) {
        // Update status to pending
        const { data, error } = await supabase
          .from('line_users')
          .update({ status: 'pending' })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      // Create a stub record with a placeholder line_user_id
      const placeholderId = `pending_${ownerType}_${ownerId}`;
      const insertPayload = {
        line_user_id: placeholderId,
        status: 'pending',
        member_id: ownerType === 'member' ? ownerId : null,
        lead_id: ownerType === 'lead' ? ownerId : null,
        staff_id: ownerType === 'staff' ? ownerId : null,
      };

      const { data, error } = await supabase
        .from('line_users')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lineIdentity(variables.ownerType, variables.ownerId) });
      toast.success(i18n.t('toast.lineLinkSent'));
      logActivity({ event_type: 'line_link_requested', metadata: { owner_type: variables.ownerType, owner_id: variables.ownerId } });
    },
    onError: (error: Error) => {
      toast.error(error.message || i18n.t('toast.lineLinkFailed'));
    },
  });
};

export const useUnlinkLineIdentity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ownerType, ownerId }: { ownerType: OwnerType; ownerId: string }) => {
      const col = ownerColumn(ownerType);
      const { error } = await supabase
        .from('line_users')
        .delete()
        .eq(col, ownerId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lineIdentity(variables.ownerType, variables.ownerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lineUsers() });
      toast.success(i18n.t('toast.lineUnlinked'));
      logActivity({ event_type: 'line_unlinked', metadata: { owner_type: variables.ownerType, owner_id: variables.ownerId } });
    },
    onError: (error: Error) => {
      toast.error(error.message || i18n.t('toast.lineUnlinkFailed'));
    },
  });
};
