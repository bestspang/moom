import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  comparison?: {
    value: number;
    label?: string;
  };
  color?: 'default' | 'teal' | 'orange' | 'blue' | 'magenta' | 'gray';
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const StatCard = ({
  title,
  value,
  subtitle,
  comparison,
  color = 'default',
  icon,
  action,
}: StatCardProps) => {
  const getColorClasses = () => {
    switch (color) {
      case 'teal':
        return 'border-l-4 border-l-accent-teal';
      case 'orange':
        return 'border-l-4 border-l-primary';
      case 'blue':
        return 'border-l-4 border-l-blue-500';
      case 'magenta':
        return 'border-l-4 border-l-pink-500';
      case 'gray':
        return 'border-l-4 border-l-gray-400';
      default:
        return '';
    }
  };

  const getTrendIcon = () => {
    if (!comparison) return null;
    if (comparison.value > 0) {
      return <TrendingUp className="h-4 w-4 text-accent-teal" />;
    } else if (comparison.value < 0) {
      return <TrendingDown className="h-4 w-4 text-destructive" />;
    }
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card className={cn('shadow-card', getColorClasses())}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
            {comparison && (
              <div className="flex items-center gap-1 mt-2 text-sm">
                {getTrendIcon()}
                <span
                  className={cn(
                    comparison.value > 0 && 'text-accent-teal',
                    comparison.value < 0 && 'text-destructive',
                    comparison.value === 0 && 'text-muted-foreground'
                  )}
                >
                  {comparison.value > 0 ? '+' : ''}
                  {comparison.value}%
                </span>
                {comparison.label && (
                  <span className="text-muted-foreground ml-1">
                    {comparison.label}
                  </span>
                )}
              </div>
            )}
          </div>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        {action && <div className="mt-3">{action}</div>}
      </CardContent>
    </Card>
  );
};
