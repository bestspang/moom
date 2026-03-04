import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';
import { logActivity } from '@/lib/activityLogger';

type AnnouncementStatus = Database['public']['Enums']['announcement_status'];

export interface AnnouncementChannels {
  in_app: boolean;
  line: boolean;
}

/** Compute status from dates — single source of truth */
export function computeAnnouncementStatus(
  publishDate: string | null,
  endDate: string | null,
): AnnouncementStatus {
  const now = new Date();
  if (!publishDate || now < new Date(publishDate)) return 'scheduled';
  if (!endDate || now <= new Date(endDate)) return 'active';
  return 'completed';
}

export interface Announcement {
  id: string;
  message: string;
  message_en: string | null;
  message_th: string | null;
  publish_date: string | null;
  end_date: string | null;
  status: AnnouncementStatus | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  channels: AnnouncementChannels | null;
  target_mode: string | null;
  target_location_ids: string[] | null;
  line_broadcast_status: Record<string, unknown> | null;
  /** Computed client-side from dates */
  computed_status: AnnouncementStatus;
  staff?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

export interface AnnouncementFormData {
  message_en: string;
  message_th: string;
  publish_date: string;
  end_date: string;
  channels: AnnouncementChannels;
  target_mode: string;
  target_location_ids: string[];
}

export const useAnnouncements = (status?: AnnouncementStatus | null, search?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['announcements', status, search],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from('announcements')
        .select(`
          id,
          message,
          message_en,
          message_th,
          publish_date,
          end_date,
          status,
          created_at,
          updated_at,
          created_by,
          channels,
          target_mode,
          target_location_ids,
          line_broadcast_status,
          staff:created_by (
            id,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      // Date-based filtering instead of status column
      if (status === 'scheduled') {
        query = query.gt('publish_date', new Date().toISOString());
      } else if (status === 'active') {
        const now = new Date().toISOString();
        query = query.lte('publish_date', now).gte('end_date', now);
      } else if (status === 'completed') {
        query = query.lt('end_date', new Date().toISOString());
      }

      if (search) {
        query = query.or(`message_en.ilike.%${search}%,message_th.ilike.%${search}%,message.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Enrich with computed status
      return (data as unknown as Omit<Announcement, 'computed_status'>[]).map((row) => ({
        ...row,
        computed_status: computeAnnouncementStatus(row.publish_date, row.end_date),
      })) as Announcement[];
    },
  });
};

export const useAnnouncementStats = () => {
  const { user } = useAuth();
  const now = new Date().toISOString();

  return useQuery({
    queryKey: ['announcement-stats'],
    enabled: !!user,
    queryFn: async () => {
      const [scheduledRes, activeRes, completedRes] = await Promise.all([
        supabase
          .from('announcements')
          .select('id', { count: 'exact', head: true })
          .gt('publish_date', now),
        supabase
          .from('announcements')
          .select('id', { count: 'exact', head: true })
          .lte('publish_date', now)
          .gte('end_date', now),
        supabase
          .from('announcements')
          .select('id', { count: 'exact', head: true })
          .lt('end_date', now),
      ]);

      if (scheduledRes.error) throw scheduledRes.error;
      if (activeRes.error) throw activeRes.error;
      if (completedRes.error) throw completedRes.error;

      return {
        scheduled: scheduledRes.count ?? 0,
        active: activeRes.count ?? 0,
        completed: completedRes.count ?? 0,
      };
    },
  });
};

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (data: AnnouncementFormData) => {
      // Auto-compute status from dates
      const status = computeAnnouncementStatus(data.publish_date, data.end_date);

      const { data: result, error } = await supabase
        .from('announcements')
        .insert([{
          message: data.message_en, // keep legacy column populated
          message_en: data.message_en,
          message_th: data.message_th || null,
          publish_date: data.publish_date,
          end_date: data.end_date,
          status,
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

      // Sync legacy message column
      if (data.message_en !== undefined) {
        updateData.message = data.message_en;
      }

      if (data.channels) {
        updateData.channels = data.channels;
      }

      // Re-compute status if dates changed
      if (data.publish_date || data.end_date) {
        updateData.status = computeAnnouncementStatus(
          data.publish_date ?? null,
          data.end_date ?? null,
        );
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
