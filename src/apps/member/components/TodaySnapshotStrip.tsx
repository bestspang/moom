/**
 * TodaySnapshotStrip — 3 mini-stats inline ("day at a glance").
 *
 * Stats:
 *   1. Today's classes  — `todayBookingsCount` (real, computed in HomePage)
 *   2. Check-in status  — `checkedIn` (real, fetchTodayCheckin)
 *   3. XP today         — `xpToday` (real, summed from xp_ledger; null until loaded)
 */

import { Calendar, CheckCircle2, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TodaySnapshotStripProps {
  todayBookingsCount: number;
  checkedIn: boolean;
  xpToday?: number | null;
}

export function TodaySnapshotStrip({ todayBookingsCount, checkedIn, xpToday }: TodaySnapshotStripProps) {
  const { t } = useTranslation();

  const stats = [
    {
      key: 'classes',
      icon: Calendar,
      label: t('member.snapshotClassesToday'),
      value: String(todayBookingsCount),
      muted: false,
    },
    {
      key: 'checkin',
      icon: CheckCircle2,
      label: t('member.snapshotCheckin'),
      value: checkedIn ? t('member.snapshotCheckedIn') : t('member.snapshotNotYet'),
      muted: false,
      accent: checkedIn,
    },
    {
      key: 'xp',
      icon: Zap,
      label: t('member.snapshotXpToday'),
      // null only while loading / before the member id resolves.
      value: xpToday == null ? '—' : `+${xpToday}`,
      muted: xpToday == null,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.key}
            className={`rounded-xl border border-border bg-card px-2.5 py-2 ${
              s.muted ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Icon
                className={`h-3.5 w-3.5 ${s.accent ? 'text-emerald-600' : 'text-primary'}`}
                strokeWidth={2.4}
              />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide truncate">
                {s.label}
              </span>
            </div>
            <div
              className={`mt-1 text-sm font-extrabold leading-tight truncate ${
                s.accent ? 'text-emerald-600' : 'text-foreground'
              }`}
            >
              {s.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
