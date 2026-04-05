import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ReportItemProps {
  title: string;
  description: string;
  buttonText: string;
  disabled?: boolean;
  buttonVariant?: 'view' | 'export';
  onClick?: () => void;
  icon: React.ReactNode;
  accentColor?: 'primary' | 'warning' | 'teal' | 'purple';
  compact?: boolean;
}

const accentColors = {
  primary: 'border-l-primary',
  warning: 'border-l-warning',
  teal: 'border-l-accent-teal',
  purple: 'border-l-purple-500',
};

export const ReportItem = ({
  title,
  description,
  buttonText,
  buttonVariant = 'view',
  disabled,
  onClick,
  icon,
  accentColor = 'primary',
  compact = false,
}: ReportItemProps) => (
  <div className={cn(
    'border-l-4 bg-card/50 rounded-r-lg hover:bg-card/80 transition-colors',
    compact ? 'py-3 px-4 mb-2' : 'py-4 px-4 mb-3',
    accentColors[accentColor]
  )}>
    <div className={cn('flex gap-3', compact ? 'items-start' : 'flex-col sm:flex-row sm:items-start')}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="shrink-0 mt-0.5 text-muted-foreground">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={cn('text-primary font-medium', compact ? 'text-sm mb-0.5' : 'mb-1')}>{title}</h3>
          <p className={cn('text-muted-foreground', compact ? 'text-xs line-clamp-1' : 'text-sm line-clamp-2')}>{description}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          'shrink-0',
          compact ? 'text-xs' : 'border-primary text-primary hover:bg-primary/10 w-full sm:w-auto'
        )}
        onClick={onClick}
      >
        {buttonVariant === 'export' && <Download className="h-4 w-4 mr-1.5" />}
        {buttonText}
      </Button>
    </div>
  </div>
);
