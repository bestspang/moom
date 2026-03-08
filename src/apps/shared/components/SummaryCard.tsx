import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface SummaryCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function SummaryCard({ label, value, subtitle, icon, onClick, className }: SummaryCardProps) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 rounded-lg bg-card p-4 shadow-sm text-left transition-all',
        onClick && 'hover:shadow-md active:scale-[0.98] cursor-pointer',
        className
      )}
    >
      {icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground flex-shrink-0">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </Comp>
  );
}

export function SummaryCardSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-card p-4 shadow-sm">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div>
        <Skeleton className="h-3 w-16 mb-2" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}
