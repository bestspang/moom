import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { ListCard } from '@/apps/shared/components/ListCard';
import { FilterChips } from '@/apps/shared/components/FilterChips';
import { QueryError } from '@/apps/shared/components/QueryError';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Calendar, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { useDateLocale } from '@/hooks/useDateLocale';

type ScheduleItem = {
  id: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  checkedIn: number;
  status: string;
  className: string;
  categoryName: string | null;
  roomName: string | null;
  trainerName: string | null;
};

type Attendee = {
  id: string;
  name: string;
  checkedIn: boolean;
};

function AttendeeSheet({ cls, open, onClose }: { cls: ScheduleItem | null; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { data: attendees, isLoading } = useQuery({
    queryKey: ['staff-schedule-attendees', cls?.id],
    enabled: !!cls?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_bookings')
        .select('id, status, members(first_name, last_name)')
        .eq('schedule_id', cls!.id)
        .neq('status', 'cancelled');
      if (error) throw error;
      return (data ?? []).map((b: any) => ({
        id: b.id,
        name: b.members ? `${b.members.first_name} ${b.members.last_name ?? ''}`.trim() : 'Member',
        checkedIn: b.status === 'checked_in',
      })) as Attendee[];
    },
  });

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-safe max-h-[75vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>{cls?.className ?? ''}</SheetTitle>
          {cls && (
            <p className="text-sm text-muted-foreground">
              {`${cls.startTime.slice(0, 5)} – ${cls.endTime.slice(0, 5)}`}
              {cls.roomName ? ` · ${cls.roomName}` : ''}
            </p>
          )}
        </SheetHeader>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {cls ? `${cls.checkedIn}/${cls.capacity} ${t('staff.checkedIn')}` : ''}
          </span>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : !attendees?.length ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <Users className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t('staff.noAttendeesYet')}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {attendees.map(a => (
              <div key={a.id} className="flex items-center justify-between rounded-lg bg-card px-4 py-3">
                <span className="text-sm font-medium text-foreground">{a.name}</span>
                <span className={`text-xs font-medium ${a.checkedIn ? 'text-primary' : 'text-muted-foreground'}`}>
                  {a.checkedIn ? '✓' : '–'}
                </span>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function StaffSchedulePage() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [category, setCategory] = useState('all');
  const [selectedClass, setSelectedClass] = useState<ScheduleItem | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['staff-schedule'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule')
        .select('id, scheduled_date, start_time, end_time, capacity, checked_in, status, class_id, classes(name, category_id, class_categories(name)), rooms(name), staff!schedule_trainer_id_fkey(first_name, last_name)')
        .gte('scheduled_date', format(new Date(), 'yyyy-MM-dd'))
        .order('scheduled_date')
        .order('start_time');
      if (error) throw error;
      return (data ?? []).map((s: any) => ({
        id: s.id,
        scheduledDate: s.scheduled_date,
        startTime: s.start_time,
        endTime: s.end_time,
        capacity: s.capacity ?? 0,
        checkedIn: s.checked_in ?? 0,
        status: s.status,
        className: s.classes?.name ?? 'Unknown',
        categoryName: s.classes?.class_categories?.name ?? null,
        roomName: s.rooms?.name ?? null,
        trainerName: s.staff ? `${s.staff.first_name} ${s.staff.last_name}`.trim() : null,
      })) as ScheduleItem[];
    },
  });

  const categoryFilters = useMemo(() => {
    const items = data ?? [];
    const names = Array.from(new Set(items.map(c => c.categoryName).filter(Boolean))) as string[];
    return [{ value: 'all', label: t('common.all') }, ...names.map(n => ({ value: n, label: n }))];
  }, [data, t]);

  const filtered = useMemo(() => {
    const items = data ?? [];
    if (category === 'all') return items;
    return items.filter(c => c.categoryName === category);
  }, [data, category]);

  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, item) => {
    const key = item.scheduledDate;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('staff.viewSchedule')} subtitle={t('staff.scheduleSubtitle')} />
      <div className="px-4 mb-4">
        <FilterChips options={categoryFilters} selected={category} onChange={setCategory} />
      </div>
      {isError ? (
        <QueryError onRetry={() => refetch()} />
      ) : isLoading ? (
        <Section><div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div></Section>
      ) : Object.keys(grouped).length === 0 ? (
        <EmptyState icon={<Calendar className="h-10 w-10" />} title={t('staff.noClassesFound')} description={t('staff.checkBackLater')} />
      ) : (
        Object.entries(grouped).map(([date, classes]) => (
          <Section key={date} title={format(parseISO(date), 'EEEE, d MMM', { locale: dateLocale })} className="mb-6">
            <div className="space-y-2">
              {classes.map(cls => (
                <ListCard
                  key={cls.id}
                  title={cls.className}
                  subtitle={`${cls.startTime.slice(0, 5)} – ${cls.endTime.slice(0, 5)}${cls.roomName ? ` · ${cls.roomName}` : ''}`}
                  meta={cls.trainerName ? `${t('staff.withTrainer', { name: cls.trainerName })} · ${cls.checkedIn}/${cls.capacity}` : t('staff.spots', { current: cls.checkedIn, capacity: cls.capacity })}
                  onClick={() => setSelectedClass(cls)}
                />
              ))}
            </div>
          </Section>
        ))
      )}

      <AttendeeSheet
        cls={selectedClass}
        open={!!selectedClass}
        onClose={() => setSelectedClass(null)}
      />
    </div>
  );
}
