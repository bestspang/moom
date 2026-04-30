import { cn } from '@/lib/utils';

interface MobilePageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

/** DS-aligned mobile page header.
 * Spec: px-4 py-3, title 18px / 600, subtitle 12px muted. Right-aligned action slot. */
export function MobilePageHeader({ title, subtitle, action, className }: MobilePageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between px-4 py-3', className)}>
      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-semibold tracking-tight text-foreground leading-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
