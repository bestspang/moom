import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Database } from '@/integrations/supabase/types';
import { logActivity } from '@/lib/activityLogger';

type AnnouncementStatus = Database['public']['Enums']['announcement_status'];

export interface AnnouncementChannels {
  in_app: boolean;
  line: boolean;
}

export interface Announcement {
  id: string;
  message: string;
  publish_date: string | null;
  end_date: string | null;
  status: AnnouncementStatus | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  channels: AnnouncementChannels | null;
  target_mode: string | null;
  target_location_ids: string[] | null;
  staff?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

export interface AnnouncementFormData {
  message: string;
  publish_date: string;
  end_date: string;
  status: AnnouncementStatus;
  channels: AnnouncementChannels;
  target_mode: string;
  target_location_ids: string[];
}

export const useAnnouncements = (status?: AnnouncementStatus | null, search?: string) => {
  return useQuery({
    queryKey: ['announcements', status, search],
    queryFn: async () => {
      let query = supabase
        .from('announcements')
        .select(`
          id,
          message,
          publish_date,
          end_date,
          status,
          created_at,
          updated_at,
          created_by,
          channels,
          target_mode,
          target_location_ids,
          staff:created_by (
            id,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.ilike('message', `%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as Announcement[];
    },
  });
};

export const useAnnouncementStats = () => {
  return useQuery({
    queryKey: ['announcement-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('status');

      if (error) throw error;

      const stats = {
        active: 0,
        scheduled: 0,
        completed: 0,
      };

      data?.forEach((item) => {
        if (item.status && item.status in stats) {
          stats[item.status as keyof typeof stats]++;
        }
      });

      return stats;
    },
  });
};

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (data: AnnouncementFormData) => {
      const { data: result, error } = await supabase
        .from('announcements')
        .insert([{
          message: data.message,
          publish_date: data.publish_date,
          end_date: data.end_date,
          status: data.status,
          channels: data.channels as unknown as Database['public']['Tables']['announcements']['Insert']['channels'],
          target_mode: data.target_mode,
          target_location_ids: data.target_location_ids,
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement-stats'] });
      logActivity({
        event_type: 'announcement_created',
        activity: `Announcement created`,
        entity_type: 'announcement',
        entity_id: data.id,
      });
      toast.success(t('common.success'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateAnnouncement = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AnnouncementFormData> }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = { ...data };
      if (data.channels) {
        updateData.channels = data.channels;
      }
      const { data: result, error } = await supabase
        .from('announcements')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement-stats'] });
      logActivity({
        event_type: 'announcement_updated',
        activity: `Announcement updated`,
        entity_type: 'announcement',
        entity_id: variables.id,
        new_value: variables.data as Record<string, unknown>,
      });
      toast.success(t('common.success'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement-stats'] });
      logActivity({
        event_type: 'announcement_deleted',
        activity: `Announcement deleted`,
        entity_type: 'announcement',
        entity_id: id,
      });
      toast.success(t('common.deleted'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
