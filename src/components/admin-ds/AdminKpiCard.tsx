import React from 'react';
import { cn } from '@/lib/utils';

/**
 * AdminKpiCard — DS-aligned KPI tile.
 * Tinted icon chip top-left, optional delta pill top-right, label, big tabular value, optional suffix.
 * Mirrors `KpiCardV2` from MOOM Design System (Theme.jsx).
 *
 * Existing `StatCard` remains in use; this is a parallel option for new admin layouts that want
 * the DS look without sparkline.
 */
export type AdminKpiAccent =
  | 'orange'
  | 'teal'
  | 'info'
  | 'pink'
  | 'slate'
  | 'warn'
  | 'success';

const ACCENT_CLASSES: Record<AdminKpiAccent, { fg: string; bg: string }> = {
  orange:  { fg: 'text-primary',                   bg: 'bg-primary/10' },
  teal:    { fg: 'text-accent-teal',               bg: 'bg-accent-teal/10' },
  info:    { fg: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  pink:    { fg: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-500/10' },
  slate:   { fg: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-500/10' },
  warn:    { fg: 'text-warning',                   bg: 'bg-warning/10' },
  success: { fg: 'text-success',                   bg: 'bg-success/10' },
};

export interface AdminKpiCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  suffix?: React.ReactNode;
  delta?: string;             // e.g. "+12", "-0.4%"
  icon?: React.ReactNode;
  accent?: AdminKpiAccent;
  onClick?: () => void;
  className?: string;
}

export const AdminKpiCard = ({
  label,
  value,
  suffix,
  delta,
  icon,
  accent = 'orange',
  onClick,
  className,
}: AdminKpiCardProps) => {
  const a = ACCENT_CLASSES[accent];
  const negative = typeof delta === 'string' && delta.trim().startsWith('-');

  const Wrapper: React.ElementType = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        'group flex flex-col gap-2.5 min-h-[108px] p-4 text-left',
        'bg-card border border-border rounded-xl shadow-sm',
        'transition-all duration-150',
        onClick && 'cursor-pointer hover:-translate-y-px hover:shadow-md',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            'h-8 w-8 rounded-lg flex items-center justify-center [&_svg]:h-4 [&_svg]:w-4',
            a.bg,
            a.fg
          )}
        >
          {icon}
        </div>
        {delta && (
          <span
            className={cn(
              'text-[11px] font-bold px-2 py-0.5 rounded-full',
              negative
                ? 'text-destructive bg-destructive/10'
                : 'text-success bg-success/10'
            )}
          >
            {delta}
          </span>
        )}
      </div>
      <div>
        <div className="text-xs font-medium text-muted-foreground mb-1">
          {label}
        </div>
        <div className="text-[28px] font-extrabold text-foreground leading-none tracking-tight tabular-nums">
          {value}
        </div>
        {suffix && (
          <div className="text-[11px] text-muted-foreground/80 mt-1">
            {suffix}
          </div>
        )}
      </div>
    </Wrapper>
  );
};
