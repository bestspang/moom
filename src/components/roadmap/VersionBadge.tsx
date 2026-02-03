import React from 'react';
import { Check, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type VersionStatus = 'completed' | 'inProgress' | 'planned';

interface VersionBadgeProps {
  version: string;
  status: VersionStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  completed: {
    bg: 'bg-accent-teal',
    text: 'text-white',
    icon: Check,
  },
  inProgress: {
    bg: 'bg-primary',
    text: 'text-primary-foreground',
    icon: Loader2,
  },
  planned: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    icon: Clock,
  },
};

const sizeConfig = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-3 py-1 text-sm gap-1.5',
  lg: 'px-4 py-1.5 text-base gap-2',
};

export const VersionBadge = ({
  version,
  status,
  className,
  size = 'md',
}: VersionBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold',
        config.bg,
        config.text,
        sizeConfig[size],
        className
      )}
    >
      <Icon
        className={cn(
          'flex-shrink-0',
          size === 'sm' && 'h-3 w-3',
          size === 'md' && 'h-4 w-4',
          size === 'lg' && 'h-5 w-5',
          status === 'inProgress' && 'animate-spin'
        )}
      />
      {version}
    </span>
  );
};
