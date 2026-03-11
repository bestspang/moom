import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { TIER_CONFIG, type MomentumTier } from './types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LevelPerksCard } from './LevelPerksCard';

interface TierBadgeProps {
  tier: MomentumTier;
  level?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  className?: string;
}

function TierEmblem({ tier, size }: { tier: MomentumTier; size: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 32 : size === 'md' ? 20 : 14;
  const config = TIER_CONFIG[tier];

  return (
    <svg width={dim} height={dim} viewBox="0 0 32 32" fill="none">
      <path
        d="M16 2L4 8v8c0 7.2 5.1 13.2 12 15 6.9-1.8 12-7.8 12-15V8L16 2z"
        fill={`hsl(var(${config.colorVar}))`}
        stroke={`hsl(var(${config.colorVar}) / 0.5)`}
        strokeWidth="0.5"
      />
      <path
        d="M16 9l2 4 4.5.7-3.2 3.2.8 4.5L16 19.2 11.9 21.4l.8-4.5-3.2-3.2L14 13l2-4z"
        fill="white"
        fillOpacity="0.9"
      />
    </svg>
  );
}

function BadgeContent({ tier, level, size, className }: { tier: MomentumTier; level?: number; size: 'sm' | 'md' | 'lg'; className?: string }) {
  const config = TIER_CONFIG[tier];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-bold capitalize tracking-wide',
        size === 'sm' && 'px-2.5 py-1 text-[10px]',
        size === 'md' && 'px-3 py-1.5 text-xs',
        size === 'lg' && 'px-4 py-2 text-sm',
        className,
      )}
      style={{
        backgroundColor: 'hsl(0 0% 100% / 0.75)',
        color: `hsl(var(${config.colorVar}))`,
        boxShadow: `0 0 12px hsl(var(${config.colorVar}) / 0.15), inset 0 1px 0 hsl(var(${config.colorVar}) / 0.1)`,
      }}
    >
      <TierEmblem tier={tier} size={size} />
      {config.label}
      {level !== undefined && (
        <span
          className={cn(
            'rounded-full font-black',
            size === 'sm' && 'px-1.5 py-0.5 text-[9px] min-w-[20px] text-center',
            size === 'md' && 'px-2 py-0.5 text-[10px] min-w-[24px] text-center',
            size === 'lg' && 'px-2.5 py-1 text-xs min-w-[28px] text-center',
          )}
          style={{ backgroundColor: `hsl(var(${config.colorVar}) / 0.2)` }}
        >
          {level}
        </span>
      )}
    </span>
  );
}

export function TierBadge({ tier, level, size = 'sm', interactive = true, className }: TierBadgeProps) {
  const { t } = useTranslation();
  const [perksOpen, setPerksOpen] = useState(false);
  const canOpen = interactive && level !== undefined;

  if (!canOpen) {
    return <BadgeContent tier={tier} level={level} size={size} className={className} />;
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setPerksOpen(true); }}
        className="appearance-none"
      >
        <BadgeContent tier={tier} level={level} size={size} className={className} />
      </button>
      <Dialog open={perksOpen} onOpenChange={setPerksOpen}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{t('member.levelPerks')}</DialogTitle>
          </DialogHeader>
          <LevelPerksCard currentLevel={level} />
        </DialogContent>
      </Dialog>
    </>
  );
}
