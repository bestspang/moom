import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { getDateLocale } from '@/lib/formatters';
import {
  Bell,
  Calendar,
  CreditCard,
  UserPlus,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  type Notification,
} from '@/hooks/useNotifications';
import { PageHeader, EmptyState } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type NotificationType = Database['public']['Enums']['notification_type'];

const notificationTypes: NotificationType[] = [
  'booking_confirmed',
  'class_cancellation',
  'payment_received',
  'member_registration',
  'package_expiring',
];

const Notifications = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [typeFilters, setTypeFilters] = useState<NotificationType[]>([]);

  const { data: notifications, isLoading } = useNotifications(
    statusFilter,
    typeFilters.length > 0 ? typeFilters : undefined
  );
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const getNotificationIcon = (type: NotificationType) => {
    const icons: Record<NotificationType, React.ReactNode> = {
      booking_confirmed: <Calendar className="h-5 w-5 text-accent-teal" />,
      class_cancellation: <X className="h-5 w-5 text-destructive" />,
      payment_received: <CreditCard className="h-5 w-5 text-green-500" />,
      member_registration: <UserPlus className="h-5 w-5 text-primary" />,
      package_expiring: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    };
    return icons[type] || <Bell className="h-5 w-5 text-muted-foreground" />;
  };

  const getTypeLabel = (type: NotificationType) => {
    const labels: Record<NotificationType, string> = {
      booking_confirmed: t('notifications.types.booking'),
      class_cancellation: t('notifications.types.cancellation'),
      payment_received: t('notifications.types.payment'),
      member_registration: t('notifications.types.registration'),
      package_expiring: t('notifications.types.expiring'),
    };
    return labels[type] || type;
  };

  const toggleTypeFilter = (type: NotificationType) => {
    setTypeFilters((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const getNavigationTarget = (notification: Notification): string | null => {
    switch (notification.type) {
      case 'package_expiring':
        return notification.related_entity_id ? `/members/${notification.related_entity_id}/detail` : null;
      case 'payment_received':
        return '/finance?tab=transactions';
      case 'member_registration':
        return notification.related_entity_id ? `/members/${notification.related_entity_id}/detail` : '/members';
      case 'booking_confirmed':
        return '/calendar';
      case 'class_cancellation':
        return '/calendar';
      default:
        return null;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    const target = getNavigationTarget(notification);
    if (target) {
      navigate(target);
    }
  };

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  return (
    <div>
      <PageHeader
        title={t('notifications.title')}
        breadcrumbs={[{ label: t('notifications.title') }]}
        actions={
          unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <Check className="h-4 w-4 mr-2" />
              {t('notifications.markAllRead')}
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Status filter */}
        <div className="flex gap-2">
          {(['all', 'unread', 'read'] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={statusFilter === status ? 'bg-primary' : ''}
            >
              {status === 'all' ? t('common.all') :
               status === 'unread' ? t('notifications.unread') :
               t('notifications.read')}
            </Button>
          ))}
        </div>

        {/* Type filters — pill toggles */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">{t('common.filter')}:</span>
          {notificationTypes.map((type) => (
            <Button
              key={type}
              variant={typeFilters.includes(type) ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleTypeFilter(type)}
              className="gap-1.5 h-8"
            >
              {getNotificationIcon(type)}
              <span className="text-xs">{getTypeLabel(type)}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Notification List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !notifications || notifications.length === 0 ? (
        <EmptyState message={t('notifications.noUnread')} />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={cn(
                'flex items-start gap-4 p-4 rounded-lg border bg-card cursor-pointer transition-colors hover:bg-accent/50',
                !notification.is_read && 'border-l-4 border-l-primary'
              )}
            >
              <div className="flex-shrink-0 mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn('font-medium', !notification.is_read && 'font-semibold')}>
                    {notification.title}
                  </p>
                  {!notification.is_read && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                      {t('notifications.new')}
                    </Badge>
                  )}
                </div>
                {notification.message && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {notification.created_at
                    ? formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: getDateLocale(language),
                      })
                    : '-'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
