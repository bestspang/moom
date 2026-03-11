import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export type StatusTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'black';

export const STATUS_TIER_CONFIG: Record<StatusTier, { label: string; labelTh: string; colorVar: string; emoji: string }> = {
  bronze:   { label: 'Bronze',   labelTh: 'บรอนซ์',   colorVar: '--status-tier-bronze',   emoji: '🥉' },
  silver:   { label: 'Silver',   labelTh: 'ซิลเวอร์', colorVar: '--status-tier-silver',   emoji: '🥈' },
  gold:     { label: 'Gold',     labelTh: 'โกลด์',     colorVar: '--status-tier-gold',     emoji: '🥇' },
  platinum: { label: 'Platinum', labelTh: 'แพลทินัม', colorVar: '--status-tier-platinum', emoji: '💠' },
  diamond:  { label: 'Diamond',  labelTh: 'ไดมอนด์',  colorVar: '--status-tier-diamond',  emoji: '💎' },
  black:    { label: 'Black',    labelTh: 'แบล็ค',     colorVar: '--status-tier-black',    emoji: '🖤' },
};

interface StatusTierBadgeProps {
  tier: StatusTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function StatusTierBadge({ tier, size = 'sm', showLabel = true, className }: StatusTierBadgeProps) {
  const { i18n } = useTranslation();
  const config = STATUS_TIER_CONFIG[tier];
  const label = i18n.language === 'th' ? config.labelTh : config.label;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-bold tracking-wide',
        size === 'sm' && 'px-2.5 py-1 text-[10px]',
        size === 'md' && 'px-3 py-1.5 text-xs',
        size === 'lg' && 'px-4 py-2 text-sm',
        className,
      )}
      style={{
        backgroundColor: `hsl(var(${config.colorVar}) / 0.15)`,
        color: `hsl(var(${config.colorVar}))`,
        boxShadow: `0 0 8px hsl(var(${config.colorVar}) / 0.1)`,
      }}
    >
      <span className={cn(size === 'sm' && 'text-xs', size === 'md' && 'text-sm', size === 'lg' && 'text-base')}>
        {config.emoji}
      </span>
      {showLabel && label}
    </span>
  );
}
