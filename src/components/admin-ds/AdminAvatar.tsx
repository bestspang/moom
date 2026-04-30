import React from 'react';
import { cn } from '@/lib/utils';
import { AdminStatusDot, type AdminStatusTone } from './AdminStatusDot';

/**
 * AdminAvatar — initials avatar with optional status dot + ring accent.
 * Works for member, trainer, staff. Uses a deterministic accent if none given.
 */
const ACCENTS = [
  { fg: 'text-primary',                bg: 'bg-primary/10' },
  { fg: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-500/10' },
  { fg: 'text-pink-600 dark:text-pink-400',   bg: 'bg-pink-500/10' },
  { fg: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10' },
  { fg: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  { fg: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
];

const hashIndex = (seed: string, mod: number) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
};

const initialsFrom = (name: string) => {
  const clean = (name || '').trim();
  if (!clean) return '?';
  const parts = clean.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0] || '').join('').toUpperCase() || '?';
};

export interface AdminAvatarProps {
  name: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: AdminStatusTone;
  pulse?: boolean;
  className?: string;
}

const SIZES = {
  sm: { box: 'h-8 w-8 text-[11px]',  dot: 'h-2 w-2  -bottom-0 -right-0' },
  md: { box: 'h-10 w-10 text-xs',    dot: 'h-2.5 w-2.5 -bottom-0 -right-0' },
  lg: { box: 'h-12 w-12 text-sm',    dot: 'h-3 w-3 -bottom-0 -right-0' },
};

export const AdminAvatar = ({
  name,
  initials,
  size = 'md',
  status,
  pulse,
  className,
}: AdminAvatarProps) => {
  const accent = ACCENTS[hashIndex(name || 'x', ACCENTS.length)];
  const s = SIZES[size];
  return (
    <div className={cn('relative shrink-0', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold tracking-wide',
          s.box,
          accent.bg,
          accent.fg,
        )}
      >
        {initials || initialsFrom(name)}
      </div>
      {status && (
        <span
          className={cn(
            'absolute rounded-full ring-2 ring-card',
            s.dot,
          )}
        >
          <AdminStatusDot tone={status} size="md" pulse={pulse} className="h-full w-full" />
        </span>
      )}
    </div>
  );
};
