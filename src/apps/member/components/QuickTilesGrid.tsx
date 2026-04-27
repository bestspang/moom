/**
 * QuickTilesGrid — 4-tile quick navigation under the hero card.
 *
 * All targets are real, existing routes:
 *   - จองคลาส   → /member/schedule
 *   - ประวัติ   → /member/attendance
 *   - เพื่อน    → /member/squad
 *   - รางวัล   → /member/rewards
 */

import { useNavigate } from 'react-router-dom';
import { CalendarCheck, Clock, Users, Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface QuickTile {
  key: string;
  icon: typeof CalendarCheck;
  label: string;
  to: string;
  badge?: number;
}

interface QuickTilesGridProps {
  upcomingCount?: number;
  attendanceCount?: number;
}

export function QuickTilesGrid({ upcomingCount, attendanceCount }: QuickTilesGridProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const tiles: QuickTile[] = [
    { key: 'book', icon: CalendarCheck, label: t('member.quickBook'), to: '/member/schedule', badge: upcomingCount },
    { key: 'history', icon: Clock, label: t('member.quickHistory'), to: '/member/attendance', badge: attendanceCount },
    { key: 'friends', icon: Users, label: t('member.quickFriends'), to: '/member/squad' },
    { key: 'rewards', icon: Gift, label: t('member.quickRewards'), to: '/member/rewards' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <button
            key={tile.key}
            onClick={() => navigate(tile.to)}
            className="relative flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card px-1.5 py-2.5 active:scale-[0.97] transition-transform"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" strokeWidth={2.2} />
            </div>
            <span className="text-[10px] font-bold text-foreground leading-none">{tile.label}</span>
            {tile.badge != null && tile.badge > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-extrabold tabular-nums flex items-center justify-center">
                {tile.badge > 99 ? '99+' : tile.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
