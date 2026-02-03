import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-badge px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground',
        new: 'bg-accent-teal text-white',
        pending: 'bg-primary text-primary-foreground',
        paid: 'bg-accent-teal text-white',
        active: 'bg-accent-teal text-white',
        inactive: 'bg-muted text-muted-foreground',
        suspended: 'bg-warning-light text-warning-foreground',
        'high-risk': 'bg-destructive text-white',
        'medium-risk': 'bg-warning-light text-warning-foreground',
        'low-risk': 'bg-accent-teal text-white',
        voided: 'bg-muted text-muted-foreground',
        'needs-review': 'bg-destructive text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface StatusBadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  className?: string;
}

export const StatusBadge = ({
  variant,
  children,
  className,
}: StatusBadgeProps) => {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>{children}</span>
  );
};
