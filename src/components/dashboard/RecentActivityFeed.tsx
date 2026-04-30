import React from 'react';
import { AdminCard, AdminSectionHeader } from '@/components/admin-ds';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, DoorOpen, ShoppingBag } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { formatDistanceToNow } from 'date-fns';
import { getDateLocale } from '@/lib/formatters';

const RecentActivityFeed: React.FC = () => {
  const { t, language } = useLanguage();
  const { data: activities = [], isLoading } = useRecentActivity();
  const locale = getDateLocale(language);

  return (
    <AdminCard padded={false} className="flex flex-col">
      <div className="px-4 pt-4 pb-2">
        <AdminSectionHeader
          title={
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              {t('dashboardExtra.liveActivity')}
            </span>
          }
        />
      </div>
      <div className="px-4 pb-4 pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-7 w-7 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {t('dashboardExtra.noRecentActivity')}
          </p>
        ) : (
          <div className="space-y-2.5">
            {activities.map((item) => (
              <div key={item.id} className="flex items-center gap-2.5">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {item.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {item.name}
                    <span className="font-normal text-muted-foreground ml-1.5">
                      {item.type === 'checkin' ? (
                        <><DoorOpen className="h-3 w-3 inline mb-0.5 mr-0.5" />{t('dashboardExtra.justCheckedIn')}</>
                      ) : (
                        <><ShoppingBag className="h-3 w-3 inline mb-0.5 mr-0.5" />{item.detail}</>
                      )}
                    </span>
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminCard>
  );
};

export default RecentActivityFeed;
