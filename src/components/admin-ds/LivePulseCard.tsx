import React from 'react';
import { cn } from '@/lib/utils';

export interface LivePulseCardProps {
  label: string;                 // e.g. "LIVE · สาขาอโศก"
  checkinsLabel: string;         // "เช็คอินวันนี้"
  checkins: number;
  deltaText?: string;            // "↑ +12% จากสัปดาห์ก่อน"
  deltaPositive?: boolean;
  trendLabel?: string;           // "เทรนด์ 12 ชั่วโมง"
  series?: number[];             // sparkline data
  occupancyLabel: string;        // "กำลังอยู่ในยิม"
  currentlyIn: number;
  capacity: number;
  capacityLabel?: string;        // "ความจุสูงสุด"
  className?: string;
}

const Sparkline: React.FC<{ data: number[]; height?: number }> = ({
  data,
  height = 54,
}) => {
  const safe = data.length >= 2 ? data : [0, 0];
  const w = 220;
  const h = height;
  const max = Math.max(...safe);
  const min = Math.min(...safe);
  const range = max - min || 1;
  const pts = safe.map((v, i) => {
    const x = (i / (safe.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return [x, y] as const;
  });
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
  const area = `M0 ${h} L${pts.map((p) => p.join(' ')).join(' L')} L${w} ${h} Z`;
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="live-pulse-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.45" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#live-pulse-area)" />
      <path
        d={path}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Dark "LIVE" hero card for admin Dashboard.
 * Visual port of Modern.jsx → LivePulseCard.
 * Pure presentational — accepts data via props (caller wires hooks).
 */
export const LivePulseCard: React.FC<LivePulseCardProps> = ({
  label,
  checkinsLabel,
  checkins,
  deltaText,
  deltaPositive = true,
  trendLabel,
  series,
  occupancyLabel,
  currentlyIn,
  capacity,
  capacityLabel,
  className,
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 md:p-6 shadow-lg',
        'bg-[linear-gradient(135deg,hsl(222_30%_10%)_0%,hsl(222_30%_14%)_100%)]',
        'text-white',
        className,
      )}
    >
      {/* glow accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-44 w-44 rounded-full opacity-20"
        style={{
          background:
            'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
        }}
      />

      {/* LIVE label */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-300">
          {label}
        </span>
      </div>

      {/* Main row */}
      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr_auto] md:items-end">
        {/* Check-ins today */}
        <div className="min-w-[140px]">
          <div className="text-[11px] text-slate-400">{checkinsLabel}</div>
          <div className="mt-1 text-5xl font-extrabold leading-none tracking-tight tabular-nums">
            {checkins}
          </div>
          {deltaText && (
            <div
              className={cn(
                'mt-2 text-[11px] font-semibold',
                deltaPositive ? 'text-emerald-300' : 'text-rose-300',
              )}
            >
              {deltaText}
            </div>
          )}
        </div>

        {/* Sparkline */}
        {series && series.length > 1 && (
          <div className="min-w-[180px]">
            {trendLabel && (
              <div className="mb-1 text-[11px] text-slate-400">{trendLabel}</div>
            )}
            <Sparkline data={series} height={56} />
          </div>
        )}

        {/* Occupancy */}
        <div className="text-left md:text-right">
          <div className="text-[11px] text-slate-400">{occupancyLabel}</div>
          <div className="mt-1 text-3xl font-extrabold leading-none tabular-nums">
            {currentlyIn}
            <span className="text-base font-semibold text-slate-400">
              {' '}/ {capacity}
            </span>
          </div>
          {capacityLabel && (
            <div className="mt-1 text-[10px] text-slate-400">{capacityLabel}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LivePulseCard;
