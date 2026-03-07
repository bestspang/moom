import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  comparison?: {
    value: number;
    label?: string;
  };
  trend?: number[];
  color?: 'default' | 'teal' | 'orange' | 'blue' | 'magenta' | 'gray';
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
}

/** Mini SVG sparkline — no external deps */
const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 20;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const sparklineColors: Record<string, string> = {
  teal: 'hsl(var(--accent-teal, 160 60% 45%))',
  orange: 'hsl(var(--primary))',
  blue: 'hsl(220 80% 55%)',
  magenta: 'hsl(330 80% 55%)',
  gray: 'hsl(0 0% 60%)',
  default: 'hsl(var(--primary))',
};

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(({
  title,
  value,
  subtitle,
  comparison,
  trend,
  color = 'default',
  icon,
  action,
  onClick,
}, ref) => {
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
    <Card ref={ref} className={cn('shadow-card', getColorClasses(), onClick && 'cursor-pointer hover:bg-accent/50 transition-colors')} onClick={onClick}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-lg font-bold">{value}</p>
              {trend && trend.length >= 2 && (
                <Sparkline data={trend} color={sparklineColors[color] || sparklineColors.default} />
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
            {comparison && (
              <div className="flex items-center gap-1 mt-2 text-sm">
                {getTrendIcon()}
                <span
                  className={cn(
                    'font-medium',
                    comparison.value > 0 && 'text-success',
                    comparison.value < 0 && 'text-destructive',
                    comparison.value === 0 && 'text-muted-foreground'
                  )}
                >
                  {comparison.value > 0 ? '+' : ''}
                  {comparison.value}
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
});
StatCard.displayName = 'StatCard';
