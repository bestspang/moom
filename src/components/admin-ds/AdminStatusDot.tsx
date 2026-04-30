import React from 'react';
import { cn } from '@/lib/utils';

/**
 * AdminStatusDot — small colored dot, optionally with pulse animation.
 * Used for live signals: trainer on-shift, room occupied, lead hot, member present.
 *
 * Tone maps to semantic tokens — never hard-codes hex.
 */
export type AdminStatusTone =
  | 'success'   // active / on-shift / present
  | 'warn'      // break / pending
  | 'danger'    // expired / conflict
  | 'info'      // scheduled / upcoming
  | 'muted';    // off / inactive

const TONE_BG: Record<AdminStatusTone, string> = {
  success: 'bg-success',
  warn:    'bg-warning',
  danger:  'bg-destructive',
  info:    'bg-blue-500',
  muted:   'bg-muted-foreground/40',
};

export interface AdminStatusDotProps {
  tone?: AdminStatusTone;
  pulse?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  'aria-label'?: string;
}

export const AdminStatusDot = ({
  tone = 'success',
  pulse = false,
  size = 'sm',
  className,
  'aria-label': ariaLabel,
}: AdminStatusDotProps) => (
  <span
    role={ariaLabel ? 'status' : undefined}
    aria-label={ariaLabel}
    className={cn(
      'inline-block rounded-full shrink-0',
      size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2',
      TONE_BG[tone],
      pulse && 'animate-admin-pulse',
      className,
    )}
  />
);
