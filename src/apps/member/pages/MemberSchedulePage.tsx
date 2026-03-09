import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { ListCard } from '@/apps/shared/components/ListCard';
import { FilterChips } from '@/apps/shared/components/FilterChips';
import { QueryError } from '@/apps/shared/components/QueryError';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { MobileStatusBadge } from '@/apps/shared/components/MobileStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar, BookOpen } from 'lucide-react';
import { fetchSchedule, fetchMyBookings, type ScheduleItem } from '../api/services';
import { useMemberSession } from '../hooks/useMemberSession';
import { format, parseISO } from 'date-fns';

/* ── Schedule Tab ── */
function ScheduleTab() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['member-schedule'],
    queryFn: () => fetchSchedule(),
  });

  const categoryFilters = useMemo(() => {
    const items = data ?? [];
    const names = Array.from(new Set(items.map(c => c.categoryName).filter(Boolean))) as string[];
    return [
      { value: 'all', label: 'All' },
      ...names.map(n => ({ value: n, label: n })),
    ];
  }, [data]);

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
    <>
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
          title="No classes found"
          description={category !== 'all' ? 'Try a different category' : 'Check back later for updated schedules'}
        />
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
                  trailing={
                    cls.checkedIn < cls.capacity
                      ? <span className="text-xs font-medium text-primary">Book</span>
                      : <span className="text-xs text-muted-foreground">Full</span>
                  }
                  onClick={() => navigate(`/member/schedule/${cls.id}`)}
                />
              ))}
            </div>
          </Section>
        ))
      )}
    </>
  );
}

/* ── My Bookings Tab ── */
const BOOKING_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
];

function MyBookingsTab() {
  const navigate = useNavigate();
  const { memberId } = useMemberSession();
  const [filter, setFilter] = useState('all');

  const { data: bookings, isLoading, isError, refetch } = useQuery({
    queryKey: ['member-bookings', memberId],
    queryFn: () => fetchMyBookings(memberId!),
    enabled: !!memberId,
  });

  const filtered = useMemo(() => {
    if (!bookings) return [];
    if (filter === 'all') return bookings;
    if (filter === 'upcoming') return bookings.filter(b => ['booked'].includes(b.status));
    if (filter === 'past') return bookings.filter(b => ['attended', 'no_show'].includes(b.status));
    if (filter === 'cancelled') return bookings.filter(b => b.status === 'cancelled');
    return bookings;
  }, [bookings, filter]);

  return (
    <>
      <div className="px-4 mb-4">
        <FilterChips options={BOOKING_FILTERS} selected={filter} onChange={setFilter} />
      </div>

      <Section>
        {isError ? (
          <QueryError onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-10 w-10" />}
            title={filter !== 'all' ? 'No bookings' : 'No bookings yet'}
            description={filter !== 'all' ? 'Try a different filter' : 'Browse the schedule to book your first class'}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map(booking => (
              <ListCard
                key={booking.id}
                title={booking.schedule.className}
                subtitle={`${format(parseISO(booking.schedule.date), 'EEE, d MMM')} · ${booking.schedule.startTime.slice(0, 5)} – ${booking.schedule.endTime.slice(0, 5)}`}
                meta={booking.schedule.trainerName ? `with ${booking.schedule.trainerName}` : undefined}
                trailing={<MobileStatusBadge status={booking.status} />}
                onClick={() => navigate(`/member/bookings/${booking.id}`)}
              />
            ))}
          </div>
        )}
      </Section>
    </>
  );
}

/* ── Page with Tabs ── */
export default function MemberSchedulePage() {
  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title="Schedule" subtitle="Browse & book classes" />

      <Tabs defaultValue="schedule" className="w-full">
        <div className="px-4 mb-4">
          <TabsList className="w-full">
            <TabsTrigger value="schedule" className="flex-1">Schedule</TabsTrigger>
            <TabsTrigger value="bookings" className="flex-1">My Bookings</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="schedule">
          <ScheduleTab />
        </TabsContent>
        <TabsContent value="bookings">
          <MyBookingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
