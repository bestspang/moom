import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { fetchMyBadges } from './api';
import { Lock } from 'lucide-react';
import { getBadgeEmoji } from './badgeEmoji';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

interface BadgeGridProps {
  memberId: string;
  className?: string;
  max?: number;
}

const RARITY_MAP: Record<string, string> = {
  bronze: '--rarity-common',
  silver: '--rarity-rare',
  gold: '--rarity-epic',
  platinum: '--rarity-legendary',
};

const RARITY_KEYS: Record<string, string> = {
  bronze: 'rarityCommon',
  silver: 'rarityRare',
  gold: 'rarityEpic',
  platinum: 'rarityLegendary',
};

function getRarityVar(tier?: string): string {
  return RARITY_MAP[tier ?? ''] ?? '--rarity-common';
}

export function BadgeGrid({ memberId, className, max }: BadgeGridProps) {
  const { t } = useTranslation();
  const { data: badges, isLoading } = useQuery({
    queryKey: ['my-badges', memberId],
    queryFn: () => fetchMyBadges(memberId),
    enabled: !!memberId,
  });

  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-4 gap-3', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  const displayed = max ? (badges ?? []).slice(0, max) : (badges ?? []);

  if (displayed.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
          <Lock className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <p className="text-xs font-medium text-muted-foreground">{t('member.completeChallengesForBadges')}</p>
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-4 gap-3', className)}>
      {displayed.map((mb, i) => {
        const rarityVar = getRarityVar(mb.badge?.tier);
        const rarityKey = RARITY_KEYS[mb.badge?.tier ?? ''];
        return (
          <div
            key={mb.id}
            className="relative flex flex-col items-center gap-1.5 rounded-xl border bg-card p-3 text-center overflow-hidden animate-bounce-in"
            style={{
              animationDelay: `${i * 60}ms`,
              boxShadow: `0 0 8px hsl(var(${rarityVar}) / 0.15)`,
              borderColor: `hsl(var(${rarityVar}) / 0.2)`,
            }}
          >
            {mb.badge?.iconUrl ? (
              <img src={mb.badge.iconUrl} alt={mb.badge.nameEn} className="h-9 w-9 drop-shadow-sm" />
            ) : (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ backgroundColor: `hsl(var(${rarityVar}) / 0.15)` }}
              >
                <Award className="h-5 w-5" style={{ color: `hsl(var(${rarityVar}))` }} />
              </div>
            )}
            <span className="text-[10px] font-semibold text-foreground leading-tight">
              {mb.badge?.nameEn ?? t('member.badgeLabel')}
            </span>
            {rarityKey && (
              <span className={cn(
                'text-[8px] font-bold uppercase tracking-wider',
                mb.badge?.tier === 'bronze' && 'text-muted-foreground',
                mb.badge?.tier === 'silver' && 'text-blue-500',
                mb.badge?.tier === 'gold' && 'text-yellow-500',
                mb.badge?.tier === 'platinum' && 'text-violet-500',
              )}>
                {t(`member.${rarityKey}`)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
