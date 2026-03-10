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

/** Reusable mobile-friendly list card */
export function ListCard({
  title, subtitle, meta, leading, trailing,
  onClick, showChevron = true, className,
}: ListCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg bg-card p-4 text-left shadow-sm transition-all',
        onClick && 'hover:shadow-md active:scale-[0.99] cursor-pointer',
        className
      )}
    >
      {leading && <div className="flex-shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate">{title}</p>
        {subtitle && <p className="text-xs text-foreground/70 mt-0.5 truncate">{subtitle}</p>}
        {meta && <p className="text-xs text-muted-foreground mt-0.5">{meta}</p>}
      </div>
      {trailing && <div className="flex-shrink-0">{trailing}</div>}
      {showChevron && onClick && (
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      )}
    </button>
  );
}
