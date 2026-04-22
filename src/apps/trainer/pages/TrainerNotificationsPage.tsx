import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { QueryError } from '@/apps/shared/components/QueryError';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';

export default function TrainerNotificationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['trainer-notifications', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, message, type, is_read, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-notifications'] });
    },
  });

  const unreadCount = data?.filter(n => !n.is_read).length ?? 0;

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader
        title={t('trainer.notifications')}
        subtitle={unreadCount > 0 ? t('trainer.unreadCount', { count: unreadCount }) : undefined}
        action={
          unreadCount > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()}>
              <CheckCheck className="h-4 w-4 mr-1" />
              {t('trainer.markAllRead')}
            </Button>
          ) : undefined
        }
      />

      {isError ? (
        <QueryError onRetry={refetch} />
      ) : isLoading ? (
        <Section>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        </Section>
      ) : !data?.length ? (
        <EmptyState
          icon={<Bell className="h-10 w-10" />}
          title={t('trainer.noNotifications')}
          description={t('trainer.noNotificationsDesc')}
        />
      ) : (
        <Section>
          <div className="space-y-2">
            {data.map(n => (
              <div
                key={n.id}
                className={`rounded-lg px-4 py-3 ${n.is_read ? 'bg-card' : 'bg-primary/5 border border-primary/20'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                </div>
                {n.message && <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>}
                {n.created_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(parseISO(n.created_at), 'dd MMM yyyy HH:mm')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
