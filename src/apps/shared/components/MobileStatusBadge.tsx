import { cn } from '@/lib/utils';

interface MobileStatusBadgeProps {
  status: string;
  className?: string;
}

/** DS pill badge: rounded-full, 10px uppercase, tracking 0.06em, semantic colors. */
const STATUS_STYLES: Record<string, string> = {
  active:    'bg-success-light text-success-foreground border-transparent dark:bg-success/20 dark:text-success',
  booked:    'bg-accent text-accent-foreground border-transparent',
  completed: 'bg-success-light text-success-foreground border-transparent dark:bg-success/20 dark:text-success',
  attended:  'bg-success-light text-success-foreground border-transparent dark:bg-success/20 dark:text-success',
  cancelled: 'bg-muted text-muted-foreground border-transparent',
  no_show:   'bg-destructive-light text-destructive border-transparent dark:bg-destructive/20',
  pending:   'bg-warning-light text-warning-foreground border-transparent dark:bg-warning/20 dark:text-warning',
  expired:   'bg-muted text-muted-foreground border-transparent',
  suspended: 'bg-destructive-light text-destructive border-transparent dark:bg-destructive/20',
  scheduled: 'bg-accent text-accent-foreground border-transparent',
};

export function MobileStatusBadge({ status, className }: MobileStatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground border-transparent';
  const label = status.replace(/_/g, ' ');

  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]',
      style,
      className
    )}>
      {label}
    </span>
  );
}
