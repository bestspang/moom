/**
 * AlmostUnlockedBadgeCard — V2 home widget teasing the closest badge.
 *
 * Reuses existing data sources (fetchAllBadges, fetchMyBadges, fetchMomentumProfile)
 * to compute the badge with the highest progress that's not yet earned.
 *
 * Hidden if no badge is between 1% and 99% progress.
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import {
  fetchAllBadges,
  fetchMyBadges,
  fetchMomentumProfile,
} from '../features/momentum/api';
import type { BadgeDefinition } from '../features/momentum/types';

interface Props {
  memberId: string;
}

function getBadgeTarget(badge: BadgeDefinition): { type: string; value: number } {
  const cond = badge.unlockCondition as Record<string, any>;
  return {
    type: cond?.type ?? 'checkin_count',
    value: cond?.value ?? cond?.count ?? 10,
  };
}

export function AlmostUnlockedBadgeCard({ memberId }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const { data: allBadges } = useQuery({
    queryKey: ['all-badges'],
    queryFn: fetchAllBadges,
  });
  const { data: myBadges } = useQuery({
    queryKey: ['my-badges', memberId],
    queryFn: () => fetchMyBadges(memberId),
    enabled: !!memberId,
  });
  const { data: momentum } = useQuery({
    queryKey: ['momentum-profile', memberId],
    queryFn: () => fetchMomentumProfile(memberId),
    enabled: !!memberId,
  });

  if (!allBadges || !myBadges || !momentum) return null;

  const earnedIds = new Set(myBadges.map((mb) => mb.badgeId));
  const estimatedAttendance = Math.floor(momentum.totalXp / 100);

  const candidates = allBadges
    .filter((b) => !earnedIds.has(b.id))
    .map((badge) => {
      const { type, value: target } = getBadgeTarget(badge);
      let current = 0;
      if (type === 'checkin_count' || type === 'attendance_count') current = estimatedAttendance;
      else if (type === 'streak_weeks') current = momentum.currentStreak;
      else if (type === 'xp_total') current = momentum.totalXp;
      else if (type === 'level') current = momentum.level;
      const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
      return { badge, current, target, percent };
    })
    .filter((m) => m.percent > 0 && m.percent < 100)
    .sort((a, b) => b.percent - a.percent);

  if (candidates.length === 0) return null;

  const top = candidates[0];
  const name = i18n.language === 'th' ? (top.badge.nameTh || top.badge.nameEn) : top.badge.nameEn;
  const remaining = top.target - top.current;

  return (
    <button
      type="button"
      onClick={() => navigate('/member/momentum')}
      className="relative w-full overflow-hidden rounded-2xl text-left p-4
                 bg-gradient-to-br from-purple-100 to-pink-100
                 dark:from-purple-500/15 dark:to-pink-500/15
                 border border-purple-200 dark:border-purple-500/30
                 active:scale-[0.99] transition-transform"
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl
                          bg-gradient-to-br from-purple-400 to-pink-500 shadow-md">
            <Trophy className="h-7 w-7 text-white" strokeWidth={2.4} />
          </div>
          {/* indicator dot */}
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-orange-500 ring-2 ring-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300">
            {t('member.almostUnlocked')}
          </div>
          <div className="text-sm font-extrabold text-foreground leading-tight mt-0.5 truncate">
            {name}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {t('member.almostUnlockedSub')
              .replace('{{n}}', String(remaining))
              .replace('{{current}}', String(top.current))
              .replace('{{target}}', String(top.target))}
          </div>
        </div>
      </div>
    </button>
  );
}
