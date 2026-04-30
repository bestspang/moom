import React from 'react';
import { cn } from '@/lib/utils';

/**
 * AdminToolbar — DS-aligned filter/search bar wrapper.
 * Used above grids (Categories, Classes, Trainers, Rooms, Promotions).
 *
 * Layout: [search slot ............ flex-1] [trailing slot]
 *         [optional second row: tabs / chips]
 */
export interface AdminToolbarProps {
  search?: React.ReactNode;
  trailing?: React.ReactNode;
  tabs?: React.ReactNode;
  className?: string;
}

export const AdminToolbar = ({
  search,
  trailing,
  tabs,
  className,
}: AdminToolbarProps) => (
  <div
    className={cn(
      'bg-card border border-border rounded-xl shadow-sm p-3 flex flex-col gap-3',
      className,
    )}
  >
    {(search || trailing) && (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        {search && <div className="flex-1 min-w-0">{search}</div>}
        {trailing && <div className="flex items-center gap-2 shrink-0">{trailing}</div>}
      </div>
    )}
    {tabs && <div>{tabs}</div>}
  </div>
);
