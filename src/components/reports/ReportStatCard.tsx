import React from 'react';
import { Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ReportStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  info?: string;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'teal';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const colorMap = {
  default: {
    border: 'border-t-muted-foreground',
    text: 'text-foreground',
  },
  primary: {
    border: 'border-t-primary',
    text: 'text-primary',
  },
  success: {
    border: 'border-t-accent-teal',
    text: 'text-accent-teal',
  },
  warning: {
    border: 'border-t-warning',
    text: 'text-warning',
  },
  danger: {
    border: 'border-t-danger',
    text: 'text-danger',
  },
  purple: {
    border: 'border-t-purple-500',
    text: 'text-purple-500',
  },
  teal: {
    border: 'border-t-accent-teal',
    text: 'text-accent-teal',
  },
};

export const ReportStatCard = ({
  title,
  value,
  subtitle,
  info,
  color = 'default',
  trend,
}: ReportStatCardProps) => {
  const colors = colorMap[color];

  return (
    <Card className={cn('border-t-4', colors.border)}>
      <CardContent className="pt-4">
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
          <span className="truncate">{title}</span>
          {info && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 shrink-0 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{info}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className={cn('text-2xl font-bold', colors.text)}>
          {value}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <div
            className={cn(
              'text-xs mt-1 flex items-center gap-1',
              trend.isPositive ? 'text-accent-teal' : 'text-danger'
            )}
          >
            <span>{trend.isPositive ? '▲' : '▼'}</span>
            <span>{Math.abs(trend.value)}% เทียบกับระยะเวลาก่อนหน้า</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
