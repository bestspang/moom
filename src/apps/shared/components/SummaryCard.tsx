import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface SummaryCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  /** When true, adds a 4px colored left border accent (DS KPI variant) */
  accent?: boolean;
}

/** DS card: rounded-xl, border, shadow-sm, p-3. KPI variant adds border-l-4 primary accent. */
export function SummaryCard({ label, value, subtitle, icon, onClick, className, accent }: SummaryCardProps) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-sm text-left transition-all',
        accent && 'border-l-4 border-l-primary',
        onClick && 'row-hover active:scale-[0.98] cursor-pointer',
        className
      )}
    >
      {icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground flex-shrink-0">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-eyebrow">{label}</p>
        <p className="mt-1 text-lg font-bold text-foreground leading-tight tabular-nums">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </Comp>
  );
}

export function SummaryCardSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div>
        <Skeleton className="h-3 w-16 mb-2" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}
