import React from 'react';
import { cn } from '@/lib/utils';
import { Users, Calendar, Package, DollarSign, Bell, FileText, Dumbbell, MapPin, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';

type EmptyStateVariant = 'default' | 'members' | 'schedule' | 'packages' | 'finance' | 'notifications' | 'notes' | 'workouts' | 'locations' | 'activity';

interface EmptyStateProps {
  icon?: React.ReactNode;
  variant?: EmptyStateVariant;
  message: string;
  description?: string;
  action?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const variantIcons: Record<EmptyStateVariant, React.ReactNode> = {
  default: null,
  members: <Users className="h-16 w-16" />,
  schedule: <Calendar className="h-16 w-16" />,
  packages: <Package className="h-16 w-16" />,
  finance: <DollarSign className="h-16 w-16" />,
  notifications: <Bell className="h-16 w-16" />,
  notes: <FileText className="h-16 w-16" />,
  workouts: <Dumbbell className="h-16 w-16" />,
  locations: <MapPin className="h-16 w-16" />,
  activity: <ClipboardList className="h-16 w-16" />,
};

export const EmptyState = ({
  icon,
  variant = 'default',
  message,
  description,
  action,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) => {
  const displayIcon = icon || variantIcons[variant];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {displayIcon && (
        <div className="mb-4 text-muted-foreground/40">
          {displayIcon}
        </div>
      )}
      <p className="text-muted-foreground font-medium text-lg">{message}</p>
      {description && (
        <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
      {!action && actionLabel && onAction && (
        <Button onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
