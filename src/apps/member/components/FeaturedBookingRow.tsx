/**
 * FeaturedBookingRow — Highlighted "your next class" row.
 *
 * Visual variant of ListCard with primary tint, matching the orange-tinted
 * highlight row in the V1 mockup. Pure presentation; data is the same
 * `MyBooking` shape from `fetchMyBookings`.
 */

import { Sparkles, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDateLocale } from '@/hooks/useDateLocale';
import { format, parseISO } from 'date-fns';

interface FeaturedBookingRowProps {
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  trainerName?: string | null;
  onClick?: () => void;
}

export function FeaturedBookingRow({
  className,
  date,
  startTime,
  endTime,
  trainerName,
  onClick,
}: FeaturedBookingRowProps) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const dateLabel = (() => {
    try {
      return format(parseISO(date), 'EEE, d MMM', { locale: dateLocale });
    } catch {
      return date;
    }
  })();

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-3 text-left active:scale-[0.99] transition-transform"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/20">
        <Sparkles className="h-4 w-4 text-primary" strokeWidth={2.4} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-extrabold uppercase tracking-wide text-primary leading-none">
          {t('member.featuredNextClass')}
        </div>
        <div className="text-sm font-bold text-foreground mt-1 truncate">{className}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {dateLabel} · {startTime.slice(0, 5)}–{endTime.slice(0, 5)}
          {trainerName ? ` · ${trainerName}` : ''}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
}
