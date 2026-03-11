import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Lock, Star, ChevronRight, Shield, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { xpForLevel, tierFromLevel, TIER_CONFIG } from './types';
import { fetchLevelBenefits, fetchPrestigeCriteria, type LevelBenefit, type PrestigeCriteriaRow } from './api';

interface LevelPerksCardProps {
  currentLevel: number;
  totalXp?: number;
}

export function LevelPerksCard({ currentLevel, totalXp }: LevelPerksCardProps) {
  const { t } = useTranslation();

  const { data: benefits, isLoading: benefitsLoading } = useQuery({
    queryKey: ['level-benefits'],
    queryFn: fetchLevelBenefits,
  });

  const { data: prestigeCriteria, isLoading: prestigeLoading } = useQuery({
    queryKey: ['prestige-criteria'],
    queryFn: fetchPrestigeCriteria,
  });

  if (benefitsLoading || prestigeLoading) return <Skeleton className="h-40 rounded-xl" />;

  // Group benefits by level
  const benefitsByLevel = new Map<number, LevelBenefit[]>();
  (benefits ?? []).forEach(b => {
    const arr = benefitsByLevel.get(b.levelNumber) ?? [];
    arr.push(b);
    benefitsByLevel.set(b.levelNumber, arr);
  });

  // Group prestige criteria by level
  const criteriaByLevel = new Map<number, PrestigeCriteriaRow[]>();
  (prestigeCriteria ?? []).forEach(c => {
    const arr = criteriaByLevel.get(c.levelNumber) ?? [];
    arr.push(c);
    criteriaByLevel.set(c.levelNumber, arr);
  });

  // Generate all 20 levels
  const allLevels = Array.from({ length: 20 }, (_, i) => {
    const num = i + 1;
    return {
      levelNumber: num,
      xpRequired: xpForLevel(num),
      tier: tierFromLevel(num),
      benefits: benefitsByLevel.get(num) ?? [],
      prestigeCriteria: criteriaByLevel.get(num) ?? [],
      isPrestige: num >= 18,
    };
  });

  const nextLevel = currentLevel < 20 ? currentLevel + 1 : null;
  const nextXp = nextLevel ? xpForLevel(nextLevel) : 0;
  const currentXp = totalXp ?? xpForLevel(currentLevel);
  const xpToNext = nextLevel ? Math.max(0, nextXp - currentXp) : 0;

  const currentTier = tierFromLevel(currentLevel);
  const currentConfig = TIER_CONFIG[currentTier];

  return (
    <div className="space-y-4">
      {/* Current level summary */}
      <div
        className="rounded-xl p-4 space-y-2"
        style={{
          backgroundColor: `hsl(var(${currentConfig.colorVar}) / 0.08)`,
          border: `1px solid hsl(var(${currentConfig.colorVar}) / 0.2)`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4" style={{ color: `hsl(var(${currentConfig.colorVar}))` }} />
            <p className="text-xs font-bold text-muted-foreground">{t('member.yourLevel')}</p>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-xs font-black"
            style={{
              backgroundColor: `hsl(var(${currentConfig.colorVar}) / 0.15)`,
              color: `hsl(var(${currentConfig.colorVar}))`,
            }}
          >
            {currentConfig.label} {currentLevel}
          </span>
        </div>
        {nextLevel ? (
          <p className="text-xs text-muted-foreground">
            {t('member.nextLevelIn', { xp: xpToNext.toLocaleString(), level: nextLevel })}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{t('member.maxLevelReached')}</p>
        )}
      </div>

      {/* All levels list */}
      <div className="space-y-1">
        {allLevels.map(l => {
          const isCurrent = l.levelNumber === currentLevel;
          const isUnlocked = l.levelNumber <= currentLevel;
          const tierConfig = TIER_CONFIG[l.tier];
          const hasBenefits = l.benefits.length > 0;

          return (
            <div
              key={l.levelNumber}
              className="flex items-start gap-2.5 rounded-lg px-3 py-2 transition-colors"
              style={isCurrent ? {
                backgroundColor: `hsl(var(${tierConfig.colorVar}) / 0.08)`,
                border: `1px solid hsl(var(${tierConfig.colorVar}) / 0.15)`,
              } : {
                opacity: isUnlocked ? 1 : 0.5,
              }}
            >
              {/* Icon */}
              <div
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full mt-0.5"
                style={{
                  backgroundColor: isUnlocked
                    ? `hsl(var(${tierConfig.colorVar}) / 0.15)`
                    : undefined,
                }}
              >
                {isUnlocked ? (
                  <Check className="h-3 w-3" style={{ color: `hsl(var(${tierConfig.colorVar}))` }} />
                ) : l.isPrestige ? (
                  <Crown className="h-3 w-3 text-amber-500" />
                ) : isCurrent ? (
                  <ChevronRight className="h-3 w-3 text-primary" />
                ) : (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-foreground">
                      Lv.{l.levelNumber}
                    </p>
                    {l.isPrestige && (
                      <Shield className="h-3 w-3 text-amber-500" />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {t('member.xpRequired', { xp: l.xpRequired.toLocaleString() })}
                  </span>
                </div>

                {/* Benefits */}
                {hasBenefits ? (
                  l.benefits.map((b) => (
                    <p key={b.id} className="text-[11px] text-muted-foreground">
                      {b.frequency === 'monthly' ? '📅 ' : b.frequency === 'ongoing' ? '♾️ ' : '🔓 '}
                      {b.descriptionEn}
                    </p>
                  ))
                ) : (
                  <p className="text-[11px] text-muted-foreground/50">{t('member.noPerksYet')}</p>
                )}

                {/* Prestige criteria for 18-20 */}
                {l.isPrestige && l.prestigeCriteria.length > 0 && (
                  <div className="mt-1 space-y-0.5 border-t border-border/30 pt-1">
                    <p className="text-[10px] font-semibold text-amber-600">
                      {t('member.prestigeRequirements', 'Prestige Requirements')}
                    </p>
                    {l.prestigeCriteria.map(c => (
                      <p key={c.criterionCode} className="text-[10px] text-muted-foreground">
                        🏆 {c.descriptionEn}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
