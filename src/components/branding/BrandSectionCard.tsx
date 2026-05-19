import React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface BrandSectionCardProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  /** HSL string for accent chip; defaults to primary. */
  accent?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * BrandSectionCard — DS card with colored icon chip + title + subtitle header,
 * mirrors `BCard` in MOOM Design System / Branding.jsx.
 */
export const BrandSectionCard: React.FC<BrandSectionCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  accent,
  action,
  children,
  className,
}) => {
  const chipStyle = accent
    ? { background: `${accent}22`, color: accent }
    : undefined;

  return (
    <div className={cn('bg-card border border-border rounded-xl shadow-sm overflow-hidden', className)}>
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/60">
        <div
          className={cn(
            'w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0',
            !accent && 'bg-primary/10 text-primary'
          )}
          style={chipStyle}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-foreground tracking-tight leading-tight">{title}</div>
          {subtitle && <div className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</div>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
};
