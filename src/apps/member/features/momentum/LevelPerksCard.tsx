import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Lock, Star, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { xpForLevel, tierFromLevel, TIER_CONFIG } from './types';

interface LevelPerk {
  levelNumber: number;
  nameEn: string;
  perks: Array<{ code: string; description: string }>;
}

async function fetchLevelPerks(): Promise<LevelPerk[]> {
  const { data, error } = await supabase
    .from('gamification_levels')
    .select('level_number, name_en, perks')
    .eq('is_active', true)
    .order('level_number', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((l: any) => ({
    levelNumber: l.level_number,
    nameEn: l.name_en,
    perks: Array.isArray(l.perks)
      ? (l.perks as any[]).map((p: any) => ({
          code: p.code ?? p.perk_code ?? '',
          description: p.description ?? p.perk_description ?? '',
        }))
      : [],
  }));
}

interface LevelPerksCardProps {
  currentLevel: number;
  totalXp?: number;
}

export function LevelPerksCard({ currentLevel, totalXp }: LevelPerksCardProps) {
  const { t } = useTranslation();
  const { data: levels, isLoading } = useQuery({
    queryKey: ['level-perks'],
    queryFn: fetchLevelPerks,
  });

  if (isLoading) return <Skeleton className="h-40 rounded-xl" />;

  // Build a map from DB levels
  const levelMap = new Map<number, LevelPerk>();
  (levels ?? []).forEach(l => levelMap.set(l.levelNumber, l));

  // Generate all 20 levels
  const allLevels = Array.from({ length: 20 }, (_, i) => {
    const num = i + 1;
    const dbLevel = levelMap.get(num);
    return {
      levelNumber: num,
      nameEn: dbLevel?.nameEn ?? `Level ${num}`,
      perks: dbLevel?.perks ?? [],
      xpRequired: xpForLevel(num),
      tier: tierFromLevel(num),
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
          const hasPerks = l.perks.length > 0;

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
                ) : isCurrent ? (
                  <ChevronRight className="h-3 w-3 text-primary" />
                ) : (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-foreground">
                    {t('member.levelPerksLabel', { level: l.levelNumber, name: l.nameEn })}
                  </p>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {t('member.xpRequired', { xp: l.xpRequired.toLocaleString() })}
                  </span>
                </div>
                {hasPerks ? (
                  l.perks.map((p, i) => (
                    <p key={i} className="text-[11px] text-muted-foreground">{p.description}</p>
                  ))
                ) : (
                  <p className="text-[11px] text-muted-foreground/50">{t('member.noPerksYet')}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
