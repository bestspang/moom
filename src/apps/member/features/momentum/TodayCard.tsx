import { cn } from '@/lib/utils';
import { Clock, MapPin, ChevronRight } from 'lucide-react';
import { differenceInMinutes, format } from 'date-fns';

interface TodayCardProps {
  booking: {
    id: string;
    schedule: {
      className: string;
      date: string;
      startTime: string;
      endTime: string;
      trainerName?: string | null;
    };
  };
  onTap?: () => void;
  className?: string;
}

export function TodayCard({ booking, onTap, className }: TodayCardProps) {
  const now = new Date();
  const [h, m] = booking.schedule.startTime.split(':').map(Number);
  const classTime = new Date(booking.schedule.date);
  classTime.setHours(h, m, 0, 0);

  const minsUntil = differenceInMinutes(classTime, now);
  const isHappeningNow = minsUntil <= 0 && minsUntil > -90;
  const isSoon = minsUntil > 0 && minsUntil <= 120;

  const urgencyLabel = isHappeningNow
    ? '🔥 Happening now!'
    : isSoon
      ? `⏰ Starting in ${minsUntil < 60 ? `${minsUntil} min` : `${Math.floor(minsUntil / 60)}h ${minsUntil % 60}m`}`
      : `📅 Today at ${booking.schedule.startTime.slice(0, 5)}`;

  return (
    <button
      onClick={onTap}
      className={cn(
        'w-full rounded-2xl border p-4 text-left transition-all active:scale-[0.98]',
        isHappeningNow
          ? 'border-primary/30 bg-primary/5 shadow-md'
          : isSoon
            ? 'border-warning/30 bg-warning/5'
            : 'border-border bg-card',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-[10px] font-bold uppercase tracking-widest mb-1',
            isHappeningNow ? 'text-primary' : isSoon ? 'text-warning' : 'text-muted-foreground',
          )}>
            {urgencyLabel}
          </p>
          <h3 className="text-sm font-bold text-foreground truncate">{booking.schedule.className}</h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span>{booking.schedule.startTime.slice(0, 5)} – {booking.schedule.endTime.slice(0, 5)}</span>
            {booking.schedule.trainerName && (
              <>
                <span className="text-border">·</span>
                <span className="truncate">with {booking.schedule.trainerName}</span>
              </>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </div>
    </button>
  );
}
