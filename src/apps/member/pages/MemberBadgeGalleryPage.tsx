import { useQuery } from '@tanstack/react-query';
import { fetchMyBadges } from '../features/momentum/api';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemberSession } from '../hooks/useMemberSession';
import { Award, Trophy } from 'lucide-react';
import { format } from 'date-fns';

const TIER_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  bronze: { bg: 'bg-amber-100 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', label: 'Common' },
  silver: { bg: 'bg-slate-100 dark:bg-slate-800/30', text: 'text-slate-600 dark:text-slate-300', label: 'Rare' },
  gold: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', label: 'Epic' },
  platinum: { bg: 'bg-violet-100 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400', label: 'Legendary' },
};

function getTierStyle(tier?: string) {
  return TIER_COLORS[tier ?? 'bronze'] ?? TIER_COLORS.bronze;
}

export default function MemberBadgeGalleryPage() {
  const { memberId } = useMemberSession();

  const { data: badges, isLoading } = useQuery({
    queryKey: ['my-badges', memberId],
    queryFn: () => fetchMyBadges(memberId!),
    enabled: !!memberId,
  });

  const earned = badges?.length ?? 0;

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title="Badge Collection" subtitle="Your achievements and milestones" />

      {/* Collection counter */}
      {!isLoading && earned > 0 && (
        <div className="px-4 mb-4">
          <div className="flex items-center justify-center gap-2 rounded-xl bg-primary/5 py-2.5">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">{earned}</span>
            <span className="text-sm text-muted-foreground">Collected</span>
          </div>
        </div>
      )}

      <Section>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
        ) : !badges || badges.length === 0 ? (
          <EmptyState
            title="No badges yet"
            description="Keep checking in and completing challenges to earn badges"
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {badges.map((mb, i) => {
              const style = getTierStyle(mb.badge?.tier);
              return (
                <div
                  key={mb.id}
                  className="relative rounded-xl border bg-card p-4 shadow-sm flex flex-col items-center text-center gap-2.5 overflow-hidden"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Tier label */}
                  <span className={`text-[8px] font-black uppercase tracking-widest rounded-full px-2 py-0.5 ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>

                  <div className={`flex h-14 w-14 items-center justify-center rounded-full ${style.bg}`}>
                    {mb.badge?.iconUrl ? (
                      <img src={mb.badge.iconUrl} alt={mb.badge.nameEn} className="h-8 w-8 drop-shadow-sm" />
                    ) : (
                      <Trophy className={`h-7 w-7 ${style.text}`} />
                    )}
                  </div>

                  <p className="text-sm font-bold text-foreground leading-tight">
                    {mb.badge?.nameEn ?? 'Badge'}
                  </p>
                  {mb.badge?.descriptionEn && (
                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                      {mb.badge.descriptionEn}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-auto font-medium">
                    {format(new Date(mb.earnedAt), 'MMM d, yyyy')}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
