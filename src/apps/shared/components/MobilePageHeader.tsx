import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { useState } from 'react';

interface MobilePageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Mobile-first page header for experience surfaces */
export function MobilePageHeader({ title, subtitle, action, className }: MobilePageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between px-4 pt-3 pb-4', className)}>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
