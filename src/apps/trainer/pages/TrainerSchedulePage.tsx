import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { ListCard } from '@/apps/shared/components/ListCard';
import { FilterChips } from '@/apps/shared/components/FilterChips';
import { QueryError } from '@/apps/shared/components/QueryError';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';

export default function TrainerSchedulePage() {
  const [category, setCategory] = useState('all');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['trainer-schedule'],
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
      }));
    },
  });

  const categoryFilters = useMemo(() => {
    const items = data ?? [];
    const names = Array.from(new Set(items.map(c => c.categoryName).filter(Boolean))) as string[];
    return [{ value: 'all', label: 'All' }, ...names.map(n => ({ value: n, label: n }))];
  }, [data]);

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
      <MobilePageHeader title="Schedule" subtitle="All upcoming classes" />
      <div className="px-4 mb-4">
        <FilterChips options={categoryFilters} selected={category} onChange={setCategory} />
      </div>
      {isError ? (
        <QueryError onRetry={() => refetch()} />
      ) : isLoading ? (
        <Section><div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div></Section>
      ) : Object.keys(grouped).length === 0 ? (
        <EmptyState icon={<Calendar className="h-10 w-10" />} title="No classes found" description="Check back later" />
      ) : (
        Object.entries(grouped).map(([date, classes]) => (
          <Section key={date} title={format(parseISO(date), 'EEEE, d MMM')} className="mb-6">
            <div className="space-y-2">
              {classes.map(cls => (
                <ListCard
                  key={cls.id}
                  title={cls.className}
                  subtitle={`${cls.startTime.slice(0, 5)} – ${cls.endTime.slice(0, 5)}${cls.roomName ? ` · ${cls.roomName}` : ''}`}
                  meta={cls.trainerName ? `with ${cls.trainerName} · ${cls.checkedIn}/${cls.capacity}` : `${cls.checkedIn}/${cls.capacity} spots`}
                />
              ))}
            </div>
          </Section>
        ))
      )}
    </div>
  );
}
