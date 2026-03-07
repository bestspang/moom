import React, { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ScheduleWithRelations } from '@/hooks/useSchedule';
import { cn } from '@/lib/utils';

interface ScheduleTimelineProps {
  schedules: ScheduleWithRelations[];
  onScheduleClick?: (schedule: ScheduleWithRelations) => void;
}

const HOUR_HEIGHT = 64; // px per hour slot
const START_HOUR = 6;
const END_HOUR = 22;

const CLASS_COLORS = [
  'bg-primary/20 border-primary/40 text-primary-foreground',
  'bg-blue-500/20 border-blue-500/40',
  'bg-emerald-500/20 border-emerald-500/40',
  'bg-amber-500/20 border-amber-500/40',
  'bg-rose-500/20 border-rose-500/40',
  'bg-violet-500/20 border-violet-500/40',
  'bg-cyan-500/20 border-cyan-500/40',
];

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function ScheduleTimeline({ schedules, onScheduleClick }: ScheduleTimelineProps) {
  const { t } = useLanguage();

  // Get unique rooms
  const rooms = useMemo(() => {
    const roomMap = new Map<string, string>();
    schedules.forEach((s) => {
      const roomId = s.room_id || 'no-room';
      const roomName = s.room?.name || t('schedule.noRoom');
      if (!roomMap.has(roomId)) roomMap.set(roomId, roomName);
    });
    if (roomMap.size === 0) roomMap.set('no-room', t('schedule.noRoom'));
    return Array.from(roomMap.entries()); // [id, name][]
  }, [schedules, t]);

  // Color mapping per class
  const classColors = useMemo(() => {
    const map = new Map<string, string>();
    let idx = 0;
    schedules.forEach((s) => {
      const classId = s.class_id;
      if (!map.has(classId)) {
        map.set(classId, CLASS_COLORS[idx % CLASS_COLORS.length]);
        idx++;
      }
    });
    return map;
  }, [schedules]);

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const totalHeight = hours.length * HOUR_HEIGHT;

  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <div
        className="grid min-w-[600px]"
        style={{
          gridTemplateColumns: `60px repeat(${rooms.length}, minmax(140px, 1fr))`,
        }}
      >
        {/* Header row */}
        <div className="sticky top-0 z-10 bg-muted border-b border-border h-10 flex items-center justify-center text-xs font-medium text-muted-foreground">
          {t('schedule.time')}
        </div>
        {rooms.map(([id, name]) => (
          <div
            key={id}
            className="sticky top-0 z-10 bg-muted border-b border-l border-border h-10 flex items-center justify-center text-xs font-medium text-foreground truncate px-2"
          >
            {name}
          </div>
        ))}

        {/* Time column + room columns */}
        <div className="relative" style={{ height: totalHeight }}>
          {hours.map((hour, i) => (
            <div
              key={hour}
              className="absolute left-0 right-0 flex items-start justify-center text-[10px] text-muted-foreground border-b border-border"
              style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
            >
              <span className="mt-1">{`${hour.toString().padStart(2, '0')}:00`}</span>
            </div>
          ))}
        </div>

        {rooms.map(([roomId]) => (
          <div key={roomId} className="relative border-l border-border" style={{ height: totalHeight }}>
            {/* Hour grid lines */}
            {hours.map((hour, i) => (
              <div
                key={hour}
                className="absolute left-0 right-0 border-b border-border"
                style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
              />
            ))}

            {/* Schedule blocks */}
            {schedules
              .filter((s) => (s.room_id || 'no-room') === roomId)
              .map((s) => {
                const startMin = timeToMinutes(s.start_time);
                const endMin = timeToMinutes(s.end_time);
                const topPx = ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                const heightPx = ((endMin - startMin) / 60) * HOUR_HEIGHT;
                const colorClass = classColors.get(s.class_id) || CLASS_COLORS[0];

                return (
                  <div
                    key={s.id}
                    className={cn(
                      'absolute left-1 right-1 rounded-md border px-1.5 py-0.5 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden',
                      colorClass,
                      s.status === 'cancelled' && 'opacity-40 line-through'
                    )}
                    style={{ top: topPx, height: Math.max(heightPx - 2, 20) }}
                    onClick={() => onScheduleClick?.(s)}
                  >
                    <p className="text-[11px] font-medium truncate text-foreground">
                      {s.class?.name || '-'}
                    </p>
                    {heightPx > 36 && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {s.trainer ? `${s.trainer.first_name} ${s.trainer.last_name}` : ''}
                      </p>
                    )}
                    {heightPx > 52 && (
                      <p className="text-[10px] text-muted-foreground">
                        {s.booked_count ?? 0}/{s.capacity || 0}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
