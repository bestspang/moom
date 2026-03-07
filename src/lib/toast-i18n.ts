/**
 * Centralized i18n toast helper for use OUTSIDE React components (hooks, services).
 * Uses i18n.t() directly — language changes are reflected immediately.
 *
 * DO NOT MODIFY — this is the single source of truth for localized toast messages.
 */
import { toast } from 'sonner';
import i18n from '@/i18n';

const t = (key: string, fallback?: string) => {
  const val = i18n.t(key);
  // i18next returns the key itself when missing — fall back gracefully
  return val === key && fallback ? fallback : val;
};

export const toastSuccess = (key: string, fallback?: string) =>
  toast.success(t(key, fallback));

export const toastError = (key: string, fallback?: string) =>
  toast.error(t(key, fallback));

/** For dynamic error messages (e.g., from server) */
export const toastErrorMessage = (message: string) =>
  toast.error(message);

/** For count-based messages like "5 items updated" */
export const toastSuccessCount = (key: string, count: number) =>
  toast.success(i18n.t(key, { count }));
