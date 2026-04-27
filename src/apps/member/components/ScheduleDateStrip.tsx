/**
 * ScheduleDateStrip — Horizontal scrollable 7-day picker for Member Schedule.
 * Pure presentational. Click selected chip again → onSelect(null) to clear filter.
 */
import { format, isSameDay } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useDateLocale } from '@/hooks/useDateLocale';
import { cn } from '@/lib/utils';

interface ScheduleDateStripProps {
  dates: Date[];
  selected: Date | null;
  onSelect: (date: Date | null) => void;
  className?: string;
}

export function ScheduleDateStrip({ dates, selected, onSelect, className }: ScheduleDateStripProps) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const today = new Date();

  return (
    <div className={cn('relative', className)}>
      <div
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
        style={{ maskImage: 'linear-gradient(to right, black calc(100% - 24px), transparent)' }}
      >
        {dates.map(d => {
          const active = selected ? isSameDay(d, selected) : false;
          const isToday = isSameDay(d, today);
          return (
            <button
              key={d.toISOString()}
              onClick={() => onSelect(active ? null : d)}
              className={cn(
                'flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-3 py-2 min-w-[52px] transition-all',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                {isToday ? t('member.todayShort') : format(d, 'EEE', { locale: dateLocale })}
              </span>
              <span className="text-base font-extrabold leading-tight mt-0.5">
                {format(d, 'd')}
              </span>
            </button>
          );
        })}
        <div className="flex-shrink-0 w-6" aria-hidden />
      </div>
    </div>
  );
}
