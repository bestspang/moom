import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { queryKeys } from '@/lib/queryKeys';
import { logActivity } from '@/lib/activityLogger';
import { useAuth } from '@/contexts/AuthContext';

type Lead = Tables<'leads'>;
type LeadInsert = TablesInsert<'leads'>;
type LeadUpdate = TablesUpdate<'leads'>;

export type LeadWithLocation = Lead & {
  register_location?: { id: string; name: string } | null;
};

export const useLeads = (search?: string, status?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.leads(search, status),
    enabled: !!user,
    queryFn: async () => {
      let query = supabase.from('leads').select('*, register_location:locations!leads_register_location_id_fkey(id, name)');
      
      if (status && status !== 'all') {
        query = query.eq('status', status as Lead['status']);
      }
      
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as LeadWithLocation[];
    },
  });
};

export const useLead = (id: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['leads', id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Lead;
    },
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: LeadInsert) => {
      const { data: newLead, error } = await supabase
        .from('leads')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return newLead;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      logActivity({
        event_type: 'lead_created',
        activity: `Lead "${data.first_name} ${data.last_name || ''}" created`,
        entity_type: 'lead',
        entity_id: data.id,
      });
      toast.success(i18n.t('toast.leadCreated'));
    },
    onError: (error) => {
      toast.error(i18n.t('toast.leadCreateFailed'));
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: LeadUpdate }) => {
      const { data: updated, error } = await supabase
        .from('leads')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: (updated, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      logActivity({
        event_type: 'lead_updated',
        activity: `Lead "${updated.first_name} ${updated.last_name || ''}" updated`,
        entity_type: 'lead',
        entity_id: variables.id,
        new_value: variables.data as Record<string, unknown>,
      });
      toast.success('Lead updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update lead: ${error.message}`);
    },
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      logActivity({
        event_type: 'lead_deleted',
        activity: `Lead deleted`,
        entity_type: 'lead',
        entity_id: id,
      });
      toast.success('Lead deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete lead: ${error.message}`);
    },
  });
};

export const useConvertLeadToMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, memberId }: { leadId: string; memberId: string }) => {
      const { error } = await supabase
        .from('leads')
        .update({ status: 'converted', converted_member_id: memberId })
        .eq('id', leadId);

      if (error) throw error;
      return { leadId, memberId };
    },
    onSuccess: ({ leadId, memberId }) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      logActivity({
        event_type: 'lead_converted',
        activity: `Lead converted to member`,
        entity_type: 'lead',
        entity_id: leadId,
        new_value: { converted_member_id: memberId },
      });
    },
    onError: (error) => {
      toast.error(`Failed to convert lead: ${error.message}`);
    },
  });
};
