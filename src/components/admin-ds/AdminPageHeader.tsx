import React from 'react';
import { cn } from '@/lib/utils';

/**
 * AdminPageHeader — DS-aligned page title + subtitle + right-side action slot.
 * Visual only. No business logic. Use on admin pages above KPI strip / sections.
 *
 * Mirrors `PageHeader` from MOOM Design System/ui_kits/admin/Components.jsx.
 */
export interface AdminPageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const AdminPageHeader = ({
  title,
  subtitle,
  actions,
  className,
}: AdminPageHeaderProps) => (
  <div
    className={cn(
      'flex items-start justify-between gap-4',
      className
    )}
  >
    <div className="min-w-0">
      <h1 className="text-[22px] font-bold text-foreground tracking-tight leading-tight m-0">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-[13px] text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
    {actions && (
      <div className="flex items-center gap-2 flex-shrink-0">
        {actions}
      </div>
    )}
  </div>
);
