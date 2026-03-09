import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { StreakFlame } from './StreakFlame';
import { TierBadge } from './TierBadge';
import { XPProgressBar } from './XPProgressBar';
import { SocialProofCheckins } from './SocialProofCheckins';
import type { MomentumProfile, ChallengeProgressEntry } from './types';
import { Sparkles, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface CheckInCelebrationProps {
  open: boolean;
  onClose: () => void;
  profile: MomentumProfile | null;
  challenges: ChallengeProgressEntry[];
}

function useCountUp(target: number, duration: number, enabled: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled) { setValue(0); return; }
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, enabled]);
  return value;
}

const CONFETTI_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--destructive))',
  'hsl(var(--accent-foreground))',
  'hsl(var(--secondary-foreground))',
];

export function CheckInCelebration({ open, onClose, profile, challenges }: CheckInCelebrationProps) {
  const [autoDismiss, setAutoDismiss] = useState(0);
  const xpDisplay = useCountUp(100, 800, open);
  const rpDisplay = useCountUp(10, 600, open);

  useEffect(() => {
    if (!open) { setAutoDismiss(0); return; }
    const interval = setInterval(() => {
      setAutoDismiss(prev => {
        if (prev >= 100) { onClose(); return 100; }
        return prev + 2;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [open, onClose]);

  if (!profile) return null;

  const activeChallenges = challenges.filter(c => c.status === 'active');

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl border-0 p-0 overflow-hidden shadow-lg bg-card">
        {/* Top accent bar */}
        <div className="h-2.5 bg-primary" />

        {/* Confetti particles */}
        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-40 overflow-hidden pointer-events-none">
            {CONFETTI_COLORS.map((color, i) =>
              Array.from({ length: 4 }).map((_, j) => (
                <div
                  key={`${i}-${j}`}
                  className="absolute animate-bounce"
                  style={{
                    left: `${10 + (i * 20) + (j * 5)}%`,
                    top: '-8px',
                    width: j % 2 === 0 ? '6px' : '8px',
                    height: j % 2 === 0 ? '6px' : '8px',
                    borderRadius: j % 2 === 0 ? '50%' : '2px',
                    backgroundColor: color,
                    animationDelay: `${i * 0.1 + j * 0.2}s`,
                    animationDuration: `${1 + j * 0.3}s`,
                    opacity: 0.7,
                  }}
                />
              ))
            )}
          </div>

          <div className="px-6 pt-10 pb-4 text-center">
            <div className="relative inline-flex items-center justify-center mb-5">
              <div
                className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/15"
                style={{ boxShadow: '0 0 40px hsl(var(--primary) / 0.3)' }}
              >
                <Zap className="h-12 w-12 text-primary animate-pulse" />
              </div>
            </div>

            <p className="text-5xl font-black tracking-tight tabular-nums text-foreground">
              +{xpDisplay} XP
            </p>
            <p className="text-base font-bold mt-1.5 text-primary">
              +{rpDisplay} RP earned 🔥
            </p>
          </div>
        </div>

        {/* Streak & Tier */}
        <div className="px-6 py-3 flex items-center justify-center gap-4">
          <StreakFlame weeklyCheckinDays={profile.weeklyCheckinDays} currentStreakWeeks={profile.currentStreak} />
          <TierBadge tier={profile.tier} level={profile.level} />
        </div>

        {/* XP bar */}
        <div className="px-6 pb-2">
          <XPProgressBar totalXP={profile.totalXp} level={profile.level} />
        </div>

        {/* Challenge progress */}
        {activeChallenges.length > 0 && (
          <div className="px-6 py-3 border-t border-border">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
              <Target className="h-3 w-3 text-primary" /> Challenge Progress
            </p>
            <div className="space-y-2">
              {activeChallenges.slice(0, 2).map(c => {
                const target = c.challenge?.goalValue ?? 1;
                const pct = Math.min(100, Math.round((c.currentValue / target) * 100));
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-foreground font-semibold truncate">{c.challenge?.nameEn}</span>
                      <span className="text-muted-foreground ml-2 flex-shrink-0 tabular-nums">{c.currentValue}/{target}</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Social proof - squad members training today */}
        {profile.memberId && (
          <SocialProofCheckins memberId={profile.memberId} />
        )}

        {/* Dismiss */}
        <div className="px-6 pb-6 pt-2 space-y-2">
          <Button onClick={onClose} className="w-full font-bold text-base" size="lg">
            <Sparkles className="h-4 w-4 mr-1.5" />
            Keep Going 🚀
          </Button>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-100"
              style={{ width: `${autoDismiss}%` }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
