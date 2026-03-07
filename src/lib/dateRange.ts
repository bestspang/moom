/**
 * Bangkok timezone date range helper.
 *
 * Supabase stores `check_in_time` as `timestamp with time zone`.
 * When we filter by date, we must specify the timezone offset
 * so "today" means midnight-to-midnight in Bangkok (UTC+7),
 * not UTC midnight which is 7 AM Bangkok.
 *
 * DO NOT MODIFY unless you understand the timezone implications.
 */
import { format, addDays } from 'date-fns';

const BANGKOK_OFFSET = '+07:00';

/**
 * Returns ISO datetime range for a Bangkok calendar day.
 * - start: `YYYY-MM-DDT00:00:00+07:00` (inclusive)
 * - end:   `YYYY-MM-(DD+1)T00:00:00+07:00` (exclusive — use with `.lt()`)
 */
export function getBangkokDayRange(date: Date): { start: string; end: string } {
  const dateStr = format(date, 'yyyy-MM-dd');
  const nextDateStr = format(addDays(date, 1), 'yyyy-MM-dd');
  return {
    start: `${dateStr}T00:00:00${BANGKOK_OFFSET}`,
    end: `${nextDateStr}T00:00:00${BANGKOK_OFFSET}`,
  };
}

/**
 * Returns the Bangkok-offset start-of-day string for a given date.
 */
export function getBangkokDayStart(date: Date): string {
  return `${format(date, 'yyyy-MM-dd')}T00:00:00${BANGKOK_OFFSET}`;
}
