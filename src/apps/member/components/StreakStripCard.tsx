/**
 * StreakStripCard — Highlighted "warm" streak strip on Member Home.
 *
 * Mockup intent: a single bright row that re-affirms momentum at a glance.
 * Hidden when streak is 0 (don't shame fresh members).
 *
 * Data: reuses `momentumProfile.currentStreak` / `longestStreak` —
 * NO new query, NO new endpoint.
 */

import { Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StreakStripCardProps {
  currentStreak: number;
  longestStreak: number;
  onClick?: () => void;
}

export function StreakStripCard({ currentStreak, longestStreak, onClick }: StreakStripCardProps) {
  const { t } = useTranslation();

  if (currentStreak <= 0) return null;

  // Next milestone: 3 / 7 / 14 / 30 / 60 / 100
  const milestones = [3, 7, 14, 30, 60, 100];
  const nextMilestone = milestones.find((m) => m > currentStreak) ?? currentStreak + 7;
  const toGo = nextMilestone - currentStreak;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2.5 text-left active:scale-[0.99] transition-transform"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
        <Flame className="h-5 w-5 text-primary" strokeWidth={2.4} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-extrabold text-foreground leading-tight">
          {t('member.streakDays').replace('{{n}}', String(currentStreak))}
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5">
          {t('member.streakNextMilestone')
            .replace('{{n}}', String(toGo))
            .replace('{{milestone}}', String(nextMilestone))}
        </div>
      </div>
      {longestStreak > currentStreak && (
        <div className="text-right flex-shrink-0">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">
            {t('member.streakBest')}
          </div>
          <div className="text-sm font-extrabold text-foreground tabular-nums">{longestStreak}</div>
        </div>
      )}
    </button>
  );
}
