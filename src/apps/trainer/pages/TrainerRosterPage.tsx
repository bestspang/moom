import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { Users, Phone, ArrowUpDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { SearchBar } from '@/components/common/SearchBar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchTrainerRoster, type RosterMember } from '@/apps/trainer/features/impact/api';

type SortMode = 'recent' | 'sessions' | 'name';

export default function TrainerRosterPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('recent');

  const { data: roster, isLoading } = useQuery({
    queryKey: ['trainer-roster'],
    queryFn: () => fetchTrainerRoster(90),
  });

  const filtered = useMemo(() => {
    if (!roster) return [];
    let list = roster;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.firstName.toLowerCase().includes(q) ||
          (m.lastName ?? '').toLowerCase().includes(q) ||
          (m.phone ?? '').includes(q)
      );
    }
    const sorted = [...list];
    if (sort === 'sessions') sorted.sort((a, b) => b.totalSessions - a.totalSessions);
    else if (sort === 'name') sorted.sort((a, b) => a.firstName.localeCompare(b.firstName));
    // 'recent' is default from RPC
    return sorted;
  }, [roster, search, sort]);

  const nextSort = () => {
    const order: SortMode[] = ['recent', 'sessions', 'name'];
    setSort(order[(order.indexOf(sort) + 1) % order.length]);
  };

  const sortLabel = sort === 'recent' ? t('trainer.sortRecent') : sort === 'sessions' ? t('trainer.sortSessions') : t('trainer.sortName');

  return (
    <div className="animate-in fade-in-0 duration-200 pb-24">
      <MobilePageHeader
        title={t('trainer.nav.roster')}
        subtitle={t('trainer.rosterSubtitle', { count: roster?.length ?? 0 })}
        action={
          <Button variant="ghost" size="sm" onClick={nextSort} className="gap-1 text-xs">
            <ArrowUpDown className="h-3.5 w-3.5" /> {sortLabel}
          </Button>
        }
      />

      <Section className="mb-4">
        <SearchBar
          placeholder={t('common.search')}
          value={search}
          onChange={setSearch}
        />
      </Section>

      {isLoading ? (
        <Section>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-card p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title={search ? t('common.noResults') : t('trainer.noRosterData')}
          description={search ? undefined : t('trainer.rosterDesc')}
        />
      ) : (
        <Section>
          <div className="space-y-2">
            {filtered.map((m) => (
              <RosterRow key={m.memberId} member={m} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function RosterRow({ member }: { member: RosterMember }) {
  const { t } = useTranslation();
  const initials = `${member.firstName.charAt(0)}${(member.lastName ?? '').charAt(0)}`.toUpperCase();
  const lastSeen = member.lastAttended
    ? formatDistanceToNow(new Date(member.lastAttended), { addSuffix: true })
    : null;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-card p-4 shadow-sm">
      <Avatar className="h-10 w-10">
        {member.avatarUrl && <AvatarImage src={member.avatarUrl} />}
        <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate">
          {member.firstName} {member.lastName ?? ''}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t('trainer.sessionsCount', { count: member.totalSessions })}
          {lastSeen && <> · {t('trainer.lastSeen', { time: lastSeen })}</>}
        </p>
      </div>

      {member.phone && (
        <a
          href={`tel:${member.phone}`}
          className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <Phone className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}
