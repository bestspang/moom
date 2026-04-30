import React from 'react';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * AdminSectionHeader — DS-aligned section title with orange icon dot + bold label
 * + optional trailing action. Mirrors `SectionTitle` from DS.
 */
export interface AdminSectionHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const AdminSectionHeader = ({
  title,
  subtitle,
  icon,
  action,
  className,
}: AdminSectionHeaderProps) => (
  <div className={cn('flex items-center gap-2', className)}>
    <span className="text-primary flex items-center">
      {icon || <Target className="h-4 w-4" />}
    </span>
    <div className="flex-1 min-w-0">
      <div className="text-[15px] font-bold text-foreground leading-tight">
        {title}
      </div>
      {subtitle && (
        <div className="text-xs text-muted-foreground mt-0.5">
          {subtitle}
        </div>
      )}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);
