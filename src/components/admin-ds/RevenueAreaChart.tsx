import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { AdminCard } from './AdminCard';
import { cn } from '@/lib/utils';

export type RevenueRange = '7d' | '30d' | 'mtd' | 'ytd';

export interface RevenueAreaChartProps {
  /** Data series: array of { date: string (label), value: number } */
  data: Array<{ date: string; value: number }>;
  /** Currently selected range (controlled). */
  range: RevenueRange;
  onRangeChange: (range: RevenueRange) => void;
  /** Total revenue label, e.g. "รายได้รายวัน" */
  title: string;
  /** Optional summary line, e.g. "รวม ฿1,132K · เฉลี่ย ฿38K/วัน" */
  summary?: string;
  /** Range tab labels — caller passes i18n strings */
  rangeLabels: Record<RevenueRange, string>;
  className?: string;
  loading?: boolean;
}

/**
 * Revenue area chart with range tabs.
 * Visual port of Modern.jsx → RevenueChart, using recharts (already in deps).
 */
export const RevenueAreaChart: React.FC<RevenueAreaChartProps> = ({
  data,
  range,
  onRangeChange,
  title,
  summary,
  rangeLabels,
  className,
  loading,
}) => {
  const ranges: RevenueRange[] = ['7d', '30d', 'mtd', 'ytd'];

  return (
    <AdminCard padded={false} className={cn('flex flex-col', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
        <div>
          <div className="text-base font-bold tracking-tight text-foreground">
            {title}
          </div>
          {summary && (
            <div className="mt-1 text-xs text-muted-foreground">{summary}</div>
          )}
        </div>
        <div className="inline-flex rounded-lg bg-muted p-0.5">
          {ranges.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRangeChange(r)}
              className={cn(
                'rounded-md px-3 py-1 text-[11px] font-bold transition-colors',
                range === r
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {rangeLabels[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-2 pb-4 pt-3">
        {loading ? (
          <div className="h-[220px] animate-pulse rounded-md bg-muted/40" />
        ) : data.length === 0 ? (
          <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
            —
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="rev-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="2 4"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                width={48}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `฿${Math.round(v / 1000)}k` : `฿${v}`
                }
              />
              <Tooltip
                cursor={{
                  stroke: 'hsl(var(--primary))',
                  strokeWidth: 1,
                  strokeDasharray: '3 3',
                }}
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'hsl(var(--popover-foreground))',
                }}
                formatter={(value: number) => [`฿${value.toLocaleString()}`, '']}
                labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                fill="url(#rev-gradient)"
                activeDot={{ r: 4, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </AdminCard>
  );
};

export default RevenueAreaChart;
