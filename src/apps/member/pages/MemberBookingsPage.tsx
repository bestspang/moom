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
import { BookOpen } from 'lucide-react';
import { useMemberSession } from '../hooks/useMemberSession';
import { fetchMyBookings } from '../api/services';
import { format, parseISO } from 'date-fns';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function MemberBookingsPage() {
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
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title="My Bookings" subtitle="Your upcoming & past bookings" />

      <div className="px-4 mb-4">
        <FilterChips options={STATUS_FILTERS} selected={filter} onChange={setFilter} />
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
            action={filter === 'all' ? <Button size="sm" onClick={() => navigate('/member/schedule')}>Browse Schedule</Button> : undefined}
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
    </div>
  );
}
