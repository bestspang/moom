import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { ListCard } from '@/apps/shared/components/ListCard';
import { FilterChips } from '@/apps/shared/components/FilterChips';
import { QueryError } from '@/apps/shared/components/QueryError';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from 'lucide-react';
import { fetchSchedule, type ScheduleItem } from '../api/services';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useDateLocale } from '@/hooks/useDateLocale';

export default function MemberSchedulePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [category, setCategory] = useState('all');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['member-schedule'],
    queryFn: () => fetchSchedule(),
  });

  const categoryFilters = useMemo(() => {
    const items = data ?? [];
    const names = Array.from(new Set(items.map(c => c.categoryName).filter(Boolean))) as string[];
    return [
      { value: 'all', label: t('member.allCategories') },
      ...names.map(n => ({ value: n, label: n })),
    ];
  }, [data, t]);

  const filtered = useMemo(() => {
    const items = data ?? [];
    if (category === 'all') return items;
    return items.filter(c => c.categoryName === category);
  }, [data, category]);

  const grouped = filtered.reduce<Record<string, ScheduleItem[]>>((acc, item) => {
    const key = item.scheduledDate;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('member.schedule')} subtitle={t('member.scheduleSubtitle')} />

      <div className="px-4 mb-4">
        <FilterChips options={categoryFilters} selected={category} onChange={setCategory} />
      </div>

      {isError ? (
        <QueryError onRetry={() => refetch()} />
      ) : isLoading ? (
        <Section>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </Section>
      ) : Object.keys(grouped).length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-10 w-10" />}
          title={t('member.noClassesFound')}
          description={category !== 'all' ? t('member.tryDifferentCategory') : t('member.checkBackSchedule')}
        />
      ) : (
        Object.entries(grouped).map(([date, classes]) => (
          <Section key={date} title={format(parseISO(date), 'EEEE, d MMM', { locale: dateLocale })} className="mb-6">
            <div className="space-y-2">
              {classes.map(cls => (
                <ListCard
                  key={cls.id}
                  title={cls.className}
                  subtitle={`${cls.startTime.slice(0, 5)} – ${cls.endTime.slice(0, 5)}${cls.roomName ? ` · ${cls.roomName}` : ''}`}
                  meta={cls.trainerName ? `${t('member.withTrainer', { name: cls.trainerName })} · ${cls.checkedIn}/${cls.capacity}` : t('member.spotsLabel', { current: cls.checkedIn, max: cls.capacity })}
                  trailing={
                    cls.checkedIn < cls.capacity
                      ? <span className="text-xs font-medium text-primary">{t('member.bookButton')}</span>
                      : <span className="text-xs text-muted-foreground">{t('member.fullLabel')}</span>
                  }
                  onClick={() => navigate(`/member/schedule/${cls.id}`)}
                />
              ))}
            </div>
          </Section>
        ))
      )}
    </div>
  );
}
