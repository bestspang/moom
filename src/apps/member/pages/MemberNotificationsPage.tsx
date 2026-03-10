import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import { Bell, Check, CheckCheck, Loader2, Gift, Trophy, Flame, CalendarCheck, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const NOTIFICATION_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  referral_completed: Gift,
  challenge_completed: Trophy,
  streak_milestone: Flame,
  booking_reminder: CalendarCheck,
  announcement: Megaphone,
  level_up: Trophy,
};

function NotificationIcon({ type }: { type?: string | null }) {
  const Icon = (type && NOTIFICATION_ICON_MAP[type]) || Bell;
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
      <Icon className="h-4 w-4 text-primary" />
    </div>
  );
}

export default function MemberNotificationsPage() {
  const { t } = useTranslation();
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <MobilePageHeader
        title={t('member.notificationsTitle')}
        subtitle={unreadCount > 0 ? t('member.unreadCount', { count: unreadCount }) : t('member.allCaughtUp')}
        action={
          unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="h-4 w-4" />
              {t('member.markAllRead')}
            </Button>
          ) : undefined
        }
      />

      <Section>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !notifications?.length ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
              <Bell className="h-8 w-8 text-primary/40" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t('member.allCaughtUpEmoji')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('member.notificationsEmptyHint')}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.is_read) markAsRead.mutate(n.id);
                }}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors',
                  n.is_read
                    ? 'bg-card/50'
                    : 'bg-primary/5 hover:bg-primary/10'
                )}
              >
                <NotificationIcon type={n.type} />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm leading-snug', !n.is_read && 'font-semibold')}>{n.title}</p>
                  {n.message && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {n.message}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-muted-foreground/60">
                    {n.created_at
                      ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true })
                      : ''}
                  </p>
                </div>
                {!n.is_read && (
                  <Check className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/40" />
                )}
              </button>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
