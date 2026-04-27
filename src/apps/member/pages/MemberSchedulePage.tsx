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
import { Switch } from '@/components/ui/switch';
import { Calendar, Search } from 'lucide-react';
import { fetchSchedule, fetchMyBookings, type ScheduleItem } from '../api/services';
import { addDays, format, parseISO, isSameDay } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useDateLocale } from '@/hooks/useDateLocale';
import { useMemberSession } from '../hooks/useMemberSession';
import { ScheduleDateStrip } from '../components/ScheduleDateStrip';
import { cn } from '@/lib/utils';

export default function MemberSchedulePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const { memberId } = useMemberSession();

  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [myBookingsOnly, setMyBookingsOnly] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['member-schedule'],
    queryFn: () => fetchSchedule(),
  });

  // Fetch own bookings only when toggle is on (still uses existing query if cached)
  const { data: myBookings } = useQuery({
    queryKey: ['member-bookings', memberId],
    queryFn: () => fetchMyBookings(memberId!),
    enabled: !!memberId,
  });

  const myScheduleIds = useMemo(
    () => new Set((myBookings ?? []).filter(b => b.status === 'booked').map(b => b.schedule.id)),
    [myBookings]
  );

  const dateStrip = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(new Date(), i)),
    []
  );

  const categoryFilters = useMemo(() => {
    const items = data ?? [];
    const names = Array.from(new Set(items.map(c => c.categoryName).filter(Boolean))) as string[];
    return [
      { value: 'all', label: t('member.allCategories') },
      ...names.map(n => ({ value: n, label: n })),
    ];
  }, [data, t]);

  const filtered = useMemo(() => {
    let items = data ?? [];

    if (category !== 'all') {
      items = items.filter(c => c.categoryName === category);
    }

    if (selectedDate) {
      items = items.filter(c => {
        try {
          return isSameDay(parseISO(c.scheduledDate), selectedDate);
        } catch {
          return false;
        }
      });
    }

    if (myBookingsOnly) {
      items = items.filter(c => myScheduleIds.has(c.id));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(c =>
        c.className.toLowerCase().includes(q) ||
        (c.classNameTh ?? '').toLowerCase().includes(q) ||
        (c.trainerName ?? '').toLowerCase().includes(q)
      );
    }

    return items;
  }, [data, category, selectedDate, myBookingsOnly, myScheduleIds, searchQuery]);

  const grouped = filtered.reduce<Record<string, ScheduleItem[]>>((acc, item) => {
    const key = item.scheduledDate;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const hasActiveFilter = category !== 'all' || selectedDate !== null || myBookingsOnly || searchQuery.trim().length > 0;

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('member.schedule')} subtitle={t('member.scheduleSubtitle')} />

      {/* Sticky filter zone */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 pb-3">
        {/* Search input */}
        <div className="px-4 pt-1 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('member.searchClasses')}
              className="w-full h-10 rounded-full bg-muted border border-transparent focus:border-primary focus:bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Date strip */}
        <div className="px-4 mb-3">
          <ScheduleDateStrip
            dates={dateStrip}
            selected={selectedDate}
            onSelect={setSelectedDate}
          />
        </div>

        {/* Category chips */}
        <div className="px-4 mb-2">
          <FilterChips options={categoryFilters} selected={category} onChange={setCategory} />
        </div>

        {/* My bookings toggle */}
        {memberId && (
          <div className="px-4 flex items-center justify-between">
            <label htmlFor="my-bookings-toggle" className="text-xs font-medium text-muted-foreground select-none">
              {t('member.myBookingsOnly')}
            </label>
            <Switch
              id="my-bookings-toggle"
              checked={myBookingsOnly}
              onCheckedChange={setMyBookingsOnly}
            />
          </div>
        )}
      </div>

      {/* Results */}
      <div className="pt-3">
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
            title={searchQuery.trim() ? t('member.noResultsForSearch') : t('member.noClassesFound')}
            description={hasActiveFilter ? t('member.tryDifferentCategory') : t('member.checkBackSchedule')}
          />
        ) : (
          Object.entries(grouped).map(([date, classes]) => {
            let label: string;
            try {
              const d = parseISO(date);
              label = isSameDay(d, new Date())
                ? t('member.todayLabel')
                : format(d, 'EEEE, d MMM', { locale: dateLocale });
            } catch {
              label = date;
            }
            return (
              <Section key={date} title={label} className="mb-6">
                <div className="space-y-2">
                  {classes.map(cls => {
                    const isFull = cls.checkedIn >= cls.capacity;
                    const ratio = cls.capacity > 0 ? cls.checkedIn / cls.capacity : 0;
                    return (
                      <ListCard
                        key={cls.id}
                        title={cls.className}
                        subtitle={`${cls.startTime.slice(0, 5)} – ${cls.endTime.slice(0, 5)}${cls.roomName ? ` · ${cls.roomName}` : ''}`}
                        meta={
                          <div className="flex flex-col gap-1 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {cls.trainerName
                                ? t('member.withTrainer', { name: cls.trainerName })
                                : t('member.spotsLabel', { current: cls.checkedIn, max: cls.capacity })}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all',
                                    ratio >= 1 ? 'bg-destructive' : ratio >= 0.8 ? 'bg-yellow-500' : 'bg-primary'
                                  )}
                                  style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-medium text-muted-foreground">
                                {cls.checkedIn}/{cls.capacity}
                              </span>
                            </div>
                          </div>
                        }
                        trailing={
                          isFull
                            ? <span className="text-xs text-muted-foreground">{t('member.fullLabel')}</span>
                            : <span className="text-xs font-medium text-primary">{t('member.bookButton')}</span>
                        }
                        onClick={() => navigate(`/member/schedule/${cls.id}`)}
                      />
                    );
                  })}
                </div>
              </Section>
            );
          })
        )}
      </div>
    </div>
  );
}
