/**
 * NextUpCard — Hero card on Member Home with 3 states.
 *
 * - has-booking:    show next today's class + Check-in / Detail CTAs
 * - no-booking:     prompt to browse schedule
 * - checked-in:     celebrate today's check-in + show next steps
 *
 * Pure presentation: parent passes the resolved state + handlers based on
 * existing data hooks (fetchMyBookings + member_attendance).
 */

import { ScanLine, Calendar, CheckCircle2, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDateLocale } from '@/hooks/useDateLocale';
import { format, parseISO } from 'date-fns';

export type NextUpState = 'has-booking' | 'no-booking' | 'checked-in';

interface NextUpCardProps {
  state: NextUpState;
  // For has-booking
  className?: string | null;
  startTime?: string | null; // 'HH:mm[:ss]'
  trainerName?: string | null;
  date?: string | null; // ISO 'YYYY-MM-DD'
  // For checked-in
  checkedInAt?: string | null; // ISO timestamp
  onPrimary: () => void;
  onSecondary: () => void;
}

export function NextUpCard({
  state,
  className,
  startTime,
  trainerName,
  date,
  checkedInAt,
  onPrimary,
  onSecondary,
}: NextUpCardProps) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const formattedTime = startTime ? startTime.slice(0, 5) : null;
  const dateLabel = date ? format(parseISO(date), 'EEE, d MMM', { locale: dateLocale }) : null;
  const checkedInTime = checkedInAt ? format(new Date(checkedInAt), 'HH:mm') : null;

  // Map state → visual gradient class (semantic tokens via Tailwind arbitrary)
  const gradients: Record<NextUpState, string> = {
    'has-booking': 'bg-gradient-to-br from-primary to-[hsl(14_90%_52%)]',
    'no-booking': 'bg-gradient-to-br from-primary to-[hsl(38_92%_52%)]',
    'checked-in': 'bg-gradient-to-br from-[hsl(152_55%_48%)] to-[hsl(165_60%_42%)]',
  };

  let eyebrow: string;
  let title: string;
  let sub: string;
  let primaryLabel: string;
  let secondaryLabel: string;
  let PrimaryIcon = ScanLine;

  switch (state) {
    case 'has-booking':
      eyebrow = formattedTime ? t('member.nextUpEyebrow').replace('{{time}}', formattedTime) : t('member.todayLabel');
      title = className ?? t('member.classDefault');
      sub = trainerName ? t('member.withTrainer').replace('{{name}}', trainerName) : (dateLabel ?? '');
      primaryLabel = t('member.checkIn');
      secondaryLabel = t('member.viewDetails');
      PrimaryIcon = ScanLine;
      break;
    case 'checked-in':
      eyebrow = checkedInTime
        ? t('member.checkedInEyebrow').replace('{{time}}', checkedInTime)
        : t('member.checkedInToday');
      title = t('member.checkedInTitle');
      sub = t('member.checkedInSub');
      primaryLabel = t('member.viewProgress');
      secondaryLabel = t('member.bookNext');
      PrimaryIcon = CheckCircle2;
      break;
    case 'no-booking':
    default:
      eyebrow = t('member.todayOpen');
      title = t('member.bookNextClass');
      sub = t('member.scheduleHint');
      primaryLabel = t('member.viewSchedule');
      secondaryLabel = t('member.justCheckIn');
      PrimaryIcon = Calendar;
      break;
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 text-primary-foreground shadow-lg ${gradients[state]}`}
    >
      {/* Decorative icon (background) */}
      <div className="absolute -top-6 -right-4 opacity-15 rotate-[-15deg] pointer-events-none">
        <PrimaryIcon size={130} strokeWidth={1.5} />
      </div>
      {/* Mockup decorative circle (top-right) */}
      <div className="absolute top-3 right-3 h-12 w-12 rounded-full bg-white/15 pointer-events-none" />
      <div className="absolute top-5 right-5 h-8 w-8 rounded-full bg-white/10 pointer-events-none" />

      <div className="relative">
        <div className="text-[10px] font-extrabold tracking-[0.08em] uppercase opacity-90">
          {eyebrow}
        </div>
        <div className="text-lg font-extrabold mt-1.5 tracking-tight leading-tight">
          {title}
        </div>
        <div className="text-xs opacity-90 mt-1 line-clamp-1">{sub}</div>

        <div className="flex gap-2 mt-3.5">
          <button
            onClick={onPrimary}
            className="flex-[1.2] inline-flex items-center justify-center gap-1.5 rounded-xl bg-card text-foreground font-extrabold text-sm py-2.5 px-3.5 hover:bg-card/95 active:scale-[0.98] transition-transform"
          >
            <PrimaryIcon className="h-4 w-4" strokeWidth={2.5} />
            {primaryLabel}
          </button>
          <button
            onClick={onSecondary}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-white/20 backdrop-blur-sm text-primary-foreground border border-white/35 font-bold text-sm py-2.5 px-3 hover:bg-white/25 active:scale-[0.98] transition-transform"
          >
            {secondaryLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
