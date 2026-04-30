import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: React.ReactNode;
  comparison?: {
    value: number;
    label?: string;
  };
  trend?: number[];
  color?: 'default' | 'teal' | 'orange' | 'blue' | 'magenta' | 'gray';
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
  /** 'default' = legacy left-bar look. 'ds-chip' = DS KpiCardV2 (tinted icon chip + delta pill + hover lift). Use in admin surface. */
  variant?: 'default' | 'ds-chip';
}

/** Mini SVG sparkline — no external deps */
const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
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
  variant = 'default',
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

  // DS KpiCardV2 variant — tinted icon chip + delta pill + hover lift
  if (variant === 'ds-chip') {
    const chipTone: Record<string, string> = {
      teal:    'bg-accent-teal/10 text-accent-teal',
      orange:  'bg-primary/10 text-primary',
      blue:    'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      magenta: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
      gray:    'bg-muted text-muted-foreground',
      default: 'bg-primary/10 text-primary',
    };
    const tone = chipTone[color] || chipTone.default;
    const deltaPos = comparison && comparison.value > 0;
    const deltaNeg = comparison && comparison.value < 0;
    return (
      <Card
        ref={ref}
        onClick={onClick}
        className={cn(
          'shadow-sm border border-border rounded-xl bg-card transition-all duration-150',
          'hover:shadow-md hover:-translate-y-px',
          onClick && 'cursor-pointer',
        )}
      >
        <CardContent className="p-4 flex flex-col gap-2.5 min-h-[108px]">
          <div className="flex items-center justify-between">
            {icon ? (
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', tone)}>
                {icon}
              </div>
            ) : <span />}
            {comparison && (
              <span
                className={cn(
                  'text-[11px] font-bold px-1.5 py-0.5 rounded-md tabular-nums',
                  deltaPos && 'text-success bg-success/10',
                  deltaNeg && 'text-destructive bg-destructive/10',
                  !deltaPos && !deltaNeg && 'text-muted-foreground bg-muted',
                )}
              >
                {comparison.value > 0 ? '+' : ''}{comparison.value}{comparison.label ? ` ${comparison.label}` : ''}
              </span>
            )}
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {title}
          </div>
          <div className="flex items-end gap-2">
            <div className="text-[28px] font-extrabold leading-none tabular-nums text-foreground">
              {value}
            </div>
            {trend && trend.length >= 2 && (
              <Sparkline data={trend} color={sparklineColors[color] || sparklineColors.default} />
            )}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {action && <div className="mt-1">{action}</div>}
        </CardContent>
      </Card>
    );
  }

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
