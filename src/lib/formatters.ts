import { format, parseISO } from 'date-fns';
import { th, enUS } from 'date-fns/locale';

// Bangkok timezone offset (GMT+7)
const BANGKOK_OFFSET = 7 * 60; // minutes

/**
 * Get date-fns locale based on language
 */
export function getDateLocale(language: string = 'en') {
  return language === 'th' ? th : enUS;
}

/**
 * Format date in Bangkok timezone
 * Format: "D MMM YYYY" (e.g., "3 FEB 2026")
 */
export function formatDate(date: Date | string, language: string = 'en'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const locale = getDateLocale(language);
  return format(d, 'd MMM yyyy', { locale }).toUpperCase();
}

/**
 * Format date with day of week
 * Format: "DAY, D MMM YYYY" (e.g., "TUE, 3 FEB 2026")
 */
export function formatDateWithDay(date: Date | string, language: string = 'en'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const locale = getDateLocale(language);
  return format(d, 'EEE, d MMM yyyy', { locale }).toUpperCase();
}

/**
 * Format time in 24-hour format
 * Format: "HH:MM" (e.g., "15:21")
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm');
}

/**
 * Format date and time
 * Format: "D MMM YYYY, HH:MM"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return `${formatDate(d)}, ${formatTime(d)}`;
}

/**
 * Format currency in THB
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format currency without symbol
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format member ID
 * Format: "M-0000001"
 */
export function formatMemberId(id: number | string): string {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;
  return `M-${String(numId).padStart(7, '0')}`;
}

/**
 * Format transaction ID
 * Format: "T-0000001"
 */
export function formatTransactionId(id: number | string): string {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;
  return `T-${String(numId).padStart(7, '0')}`;
}

/**
 * Format location ID
 * Format: "BR-0001"
 */
export function formatLocationId(id: number | string): string {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;
  return `BR-${String(numId).padStart(4, '0')}`;
}

/**
 * Get initials from name
 */
export function getInitials(firstName: string, lastName?: string): string {
  const first = firstName?.charAt(0) || '';
  const last = lastName?.charAt(0) || '';
  return (first + last).toUpperCase();
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format relative time (e.g., "2 hours ago")
 * Supports i18n via translation function
 */
export function formatRelativeTime(
  date: Date | string,
  language: string = 'en',
  t?: (key: string, options?: { n: number }) => string
): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return t ? t('time.justNow') : (language === 'th' ? 'เมื่อสักครู่' : 'just now');
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    if (t) {
      return t('time.minutesAgo', { n: diffInMinutes }).replace('{n}', String(diffInMinutes));
    }
    return language === 'th' ? `${diffInMinutes} นาทีที่แล้ว` : `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    if (t) {
      return t('time.hoursAgo', { n: diffInHours }).replace('{n}', String(diffInHours));
    }
    return language === 'th' ? `${diffInHours} ชม.ที่แล้ว` : `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    if (t) {
      return t('time.daysAgo', { n: diffInDays }).replace('{n}', String(diffInDays));
    }
    return language === 'th' ? `${diffInDays} วันที่แล้ว` : `${diffInDays}d ago`;
  }
  
  return formatDate(d, language);
}

/**
 * Calculate days between dates
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  const diffInTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffInTime / (1000 * 60 * 60 * 24));
}

/**
 * Format date for database (YYYY-MM-DD)
 */
export function formatDateForDB(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
