import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Lock, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

  return (data ?? [])
    .filter((l: any) => l.perks && Array.isArray(l.perks) && l.perks.length > 0)
    .map((l: any) => ({
      levelNumber: l.level_number,
      nameEn: l.name_en,
      perks: (l.perks as any[]).map((p: any) => ({
        code: p.code ?? p.perk_code ?? '',
        description: p.description ?? p.perk_description ?? '',
      })),
    }));
}

interface LevelPerksCardProps {
  currentLevel: number;
}

export function LevelPerksCard({ currentLevel }: LevelPerksCardProps) {
  const { t } = useTranslation();
  const { data: levels, isLoading } = useQuery({
    queryKey: ['level-perks'],
    queryFn: fetchLevelPerks,
  });

  if (isLoading) return <Skeleton className="h-40 rounded-xl" />;
  if (!levels || levels.length === 0) return null;

  const unlocked = levels.filter(l => l.levelNumber <= currentLevel);
  const upcoming = levels.filter(l => l.levelNumber > currentLevel).slice(0, 3);

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 text-primary" />
        <p className="text-sm font-bold text-foreground">{t('member.levelPerks')}</p>
      </div>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('member.perksUnlocked')}</p>
          {unlocked.map(l => (
            <div key={l.levelNumber} className="flex items-start gap-2.5">
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                <Check className="h-3 w-3 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{t('member.levelPerksLabel', { level: l.levelNumber, name: l.nameEn })}</p>
                {l.perks.map((p, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground">{p.description}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('member.perksComingNext')}</p>
          {upcoming.map(l => (
            <div key={l.levelNumber} className="flex items-start gap-2.5 opacity-60">
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted mt-0.5">
                <Lock className="h-3 w-3 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{t('member.levelPerksLabel', { level: l.levelNumber, name: l.nameEn })}</p>
                {l.perks.map((p, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground">{p.description}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
