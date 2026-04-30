import React from 'react';
import { cn } from '@/lib/utils';

/**
 * AdminCard — DS-aligned surface (white card, soft border, sm shadow, rounded-xl).
 * Use as a drop-in container for sections that previously used <Card>.
 * Existing shadcn <Card> still works everywhere — this is opt-in for DS spacing.
 */
export interface AdminCardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export const AdminCard = React.forwardRef<HTMLDivElement, AdminCardProps>(
  ({ className, padded = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-card border border-border rounded-xl shadow-sm',
        padded && 'p-4',
        className
      )}
      {...props}
    />
  )
);
AdminCard.displayName = 'AdminCard';
