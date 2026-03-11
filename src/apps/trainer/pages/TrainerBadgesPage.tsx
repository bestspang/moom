import { useQuery } from '@tanstack/react-query';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Lock } from 'lucide-react';
import { getBadgeEmoji } from '@/apps/member/features/momentum/badgeEmoji';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTrainerBadgeEarnings, fetchAllBadgesForTrainer } from '@/apps/trainer/features/impact/api';

const TIER_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  bronze: { bg: 'bg-amber-100 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', label: 'Bronze' },
  silver: { bg: 'bg-slate-100 dark:bg-slate-800/30', text: 'text-slate-600 dark:text-slate-300', label: 'Silver' },
  gold: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', label: 'Gold' },
  platinum: { bg: 'bg-violet-100 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400', label: 'Platinum' },
};

function getTierStyle(tier?: string) {
  return TIER_STYLES[tier ?? 'bronze'] ?? TIER_STYLES.bronze;
}

export default function TrainerBadgesPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: earned, isLoading } = useQuery({
    queryKey: ['trainer-badge-earnings'],
    queryFn: fetchTrainerBadgeEarnings,
    enabled: !!user,
  });

  const { data: allBadges } = useQuery({
    queryKey: ['all-badges-trainer'],
    queryFn: fetchAllBadgesForTrainer,
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  const earnedIds = new Set((earned ?? []).map(b => b.badgeId));
  const lockedBadges = (allBadges ?? []).filter(b => !earnedIds.has(b.id));
  const earnedCount = earned?.length ?? 0;
  const totalCount = allBadges?.length ?? 0;

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('trainer.badgeGallery')} subtitle={t('trainer.badgesSubtitle')} />

      {/* Collection counter */}
      {!isLoading && totalCount > 0 && (
        <div className="px-4 mb-4">
          <div className="flex items-center justify-center gap-2 rounded-xl bg-primary/5 py-2.5">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">{earnedCount}</span>
            <span className="text-sm text-muted-foreground">/ {totalCount} {t('trainer.earned')}</span>
          </div>
        </div>
      )}

      {/* Earned Badges */}
      <Section title={earnedCount > 0 ? t('trainer.earned') : undefined}>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
        ) : !earned || earned.length === 0 ? (
          <EmptyState
            title={t('trainer.noBadgesYet')}
            description={t('trainer.badgesSubtitle')}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {earned.map((mb, i) => {
              const style = getTierStyle(mb.badge?.tier);
              return (
                <div
                  key={mb.id}
                  className="relative rounded-xl border bg-card p-4 shadow-sm flex flex-col items-center text-center gap-2.5 overflow-hidden"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
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
                    {t('trainer.earnedOn')} {format(new Date(mb.earnedAt), 'MMM d, yyyy')}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <Section title={t('trainer.locked')} className="mt-4">
          <div className="grid grid-cols-2 gap-3">
            {lockedBadges.map((badge) => {
              const style = getTierStyle(badge.tier);
              return (
                <div
                  key={badge.id}
                  className="relative rounded-xl border bg-card/50 p-4 shadow-sm flex flex-col items-center text-center gap-2.5 overflow-hidden opacity-60"
                >
                  <div className="absolute top-2 right-2">
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest rounded-full px-2 py-0.5 ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                  <div className={`flex h-14 w-14 items-center justify-center rounded-full ${style.bg} grayscale`}>
                    {badge.iconUrl ? (
                      <img src={badge.iconUrl} alt={badge.nameEn} className="h-8 w-8 drop-shadow-sm grayscale" />
                    ) : (
                      <Trophy className={`h-7 w-7 ${style.text}`} />
                    )}
                  </div>
                  <p className="text-sm font-bold text-foreground leading-tight">{badge.nameEn}</p>
                  {badge.descriptionEn && (
                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{badge.descriptionEn}</p>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}
