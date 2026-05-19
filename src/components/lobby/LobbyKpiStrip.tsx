import React, { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { CheckInWithRelations } from '@/hooks/useLobby';

interface LobbyKpiStripProps {
  data: CheckInWithRelations[];
  /** "Currently in" window in minutes (default 240 = 4h). */
  currentWindowMinutes?: number;
}

interface KpiTile {
  label: string;
  value: number;
  accent?: 'primary' | 'success' | 'muted';
}

export function LobbyKpiStrip({ data, currentWindowMinutes = 240 }: LobbyKpiStripProps) {
  const { t } = useLanguage();

  const stats = useMemo(() => {
    const now = Date.now();
    const windowMs = currentWindowMinutes * 60 * 1000;
    let total = 0;
    let currentlyIn = 0;
    let walkIn = 0;
    let pkg = 0;

    for (const row of data) {
      total += 1;
      const ts = row.check_in_time ? new Date(row.check_in_time).getTime() : 0;
      if (ts && now - ts <= windowMs) currentlyIn += 1;
      const type = (row as any).check_in_type;
      if (type === 'walk_in') walkIn += 1;
      else if (type === 'package') pkg += 1;
    }

    return { total, currentlyIn, walkIn, pkg };
  }, [data, currentWindowMinutes]);

  const tiles: KpiTile[] = [
    { label: t('lobby.kpiTotal'), value: stats.total, accent: 'muted' },
    { label: t('lobby.kpiCurrentlyIn'), value: stats.currentlyIn, accent: 'primary' },
    { label: t('lobby.kpiPackage'), value: stats.pkg, accent: 'success' },
    { label: t('lobby.kpiWalkIn'), value: stats.walkIn, accent: 'muted' },
  ];

  return (
    <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="rounded-xl border border-border bg-card p-3 shadow-sm"
        >
          <p className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-semibold">
            {tile.label}
          </p>
          <p
            className={
              'mt-1 text-2xl font-semibold tabular-nums ' +
              (tile.accent === 'primary'
                ? 'text-primary'
                : tile.accent === 'success'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-foreground')
            }
          >
            {tile.value}
          </p>
        </div>
      ))}
    </div>
  );
}
