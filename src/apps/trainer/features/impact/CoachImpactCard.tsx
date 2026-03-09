import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { fetchCoachImpactProfile } from './api';
import { COACH_LEVEL_CONFIG } from './types';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, TrendingUp, ClipboardCheck, Flame } from 'lucide-react';

interface CoachImpactCardProps {
  className?: string;
}

export function CoachImpactCard({ className }: CoachImpactCardProps) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['coach-impact-profile'],
    queryFn: fetchCoachImpactProfile,
  });

  if (isLoading) {
    return (
      <div className={cn('rounded-2xl border bg-card p-5', className)}>
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-20 w-20 rounded-full mx-auto mb-3" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    );
  }

  if (!profile) return null;

  const levelConfig = COACH_LEVEL_CONFIG[profile.coach_level];
  const scoreAngle = (profile.impact_score / 100) * 270;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (scoreAngle / 360) * circumference;

  const metrics = [
    { label: 'Classes', value: profile.total_classes_taught, icon: Users },
    { label: 'Attendance', value: `${Math.round(profile.avg_attendance_rate)}%`, icon: TrendingUp },
    { label: 'Return Rate', value: `${Math.round(profile.member_return_rate)}%`, icon: ClipboardCheck },
    { label: 'Streak', value: `${profile.current_streak_weeks}w`, icon: Flame },
  ];

  return (
    <div className={cn('rounded-2xl overflow-hidden', className)} style={{ boxShadow: 'var(--shadow-lg)' }}>
      {/* Solid top bar */}
      <div
        className="h-1.5"
        style={{ backgroundColor: `hsl(var(${levelConfig.colorVar}))` }}
      />

      <div className="bg-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Coach Impact</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  backgroundColor: `hsl(var(${levelConfig.colorVar}) / 0.15)`,
                  color: `hsl(var(${levelConfig.colorVar}))`,
                  boxShadow: `0 0 8px hsl(var(${levelConfig.colorVar}) / 0.15)`,
                }}
              >
                {levelConfig.label}
              </span>
            </div>
          </div>

          {/* Score arc with glow */}
          <div className="relative h-20 w-20 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full blur-lg opacity-20"
              style={{ backgroundColor: `hsl(var(${levelConfig.colorVar}))` }}
            />
            <svg className="absolute inset-0 -rotate-[135deg]" viewBox="0 0 80 80">
              <circle
                cx="40" cy="40" r={radius}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="5"
                strokeDasharray={`${(270 / 360) * circumference} ${circumference}`}
                strokeLinecap="round"
              />
              <circle
                cx="40" cy="40" r={radius}
                fill="none"
                stroke={`hsl(var(${levelConfig.colorVar}))`}
                strokeWidth="6"
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
                style={{
                  filter: `drop-shadow(0 0 4px hsl(var(${levelConfig.colorVar}) / 0.5))`,
                }}
              />
            </svg>
            <span className="text-xl font-black text-foreground tabular-nums">{profile.impact_score}</span>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-4 gap-2">
          {metrics.map(m => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="text-center rounded-xl bg-card/60 py-2.5 px-1 border border-border/50">
                <Icon className="h-4 w-4 mx-auto mb-1.5" style={{ color: `hsl(var(${levelConfig.colorVar}))` }} />
                <p className="text-sm font-bold text-foreground tabular-nums">{m.value}</p>
                <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">{m.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
