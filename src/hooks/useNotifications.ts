import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type NotificationType = Database['public']['Enums']['notification_type'];

export interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: NotificationType;
  is_read: boolean | null;
  user_id: string;
  related_entity_id: string | null;
  related_entity_type: string | null;
  created_at: string | null;
}

export const useNotifications = (
  status?: 'all' | 'read' | 'unread',
  types?: NotificationType[]
) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', status, types, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (status === 'read') {
        query = query.eq('is_read', true);
      } else if (status === 'unread') {
        query = query.eq('is_read', false);
      }

      if (types && types.length > 0) {
        query = query.in('type', types);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id,
  });
};

export const useUnreadCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useRecentNotifications = (limit = 5) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications-recent', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
      toast.success(t('notifications.allMarkedRead'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

// Helper to get notification type icon/color
export const getNotificationTypeConfig = (type: NotificationType) => {
  const configs: Record<NotificationType, { icon: string; color: string }> = {
    booking_confirmed: { icon: 'Calendar', color: 'text-accent-teal' },
    class_cancellation: { icon: 'X', color: 'text-destructive' },
    payment_received: { icon: 'CreditCard', color: 'text-green-500' },
    member_registration: { icon: 'UserPlus', color: 'text-primary' },
    package_expiring: { icon: 'AlertTriangle', color: 'text-amber-500' },
    badge_earned: { icon: 'Award', color: 'text-yellow-500' },
    level_up: { icon: 'TrendingUp', color: 'text-primary' },
    challenge_completed: { icon: 'Target', color: 'text-green-500' },
    reward_fulfilled: { icon: 'Gift', color: 'text-purple-500' },
    streak_milestone: { icon: 'Flame', color: 'text-orange-500' },
    xp_earned: { icon: 'Zap', color: 'text-yellow-500' },
  };
  return configs[type] || { icon: 'Bell', color: 'text-muted-foreground' };
};
