import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface ListCardProps {
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  showChevron?: boolean;
  className?: string;
}

/** DS-aligned mobile-friendly list card.
 * Spec: rounded-xl (12px), 1px border, shadow-sm, p-3, row-hover. */
export function ListCard({
  title, subtitle, meta, leading, trailing,
  onClick, showChevron = true, className,
}: ListCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-all',
        onClick && 'row-hover active:scale-[0.99] cursor-pointer',
        className
      )}
    >
      {leading && <div className="flex-shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
        {meta && <div className="text-xs text-muted-foreground mt-0.5">{meta}</div>}
      </div>
      {trailing && <div className="flex-shrink-0">{trailing}</div>}
      {showChevron && onClick && (
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      )}
    </button>
  );
}
