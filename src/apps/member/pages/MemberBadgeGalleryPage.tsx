import { useQuery } from '@tanstack/react-query';
import { fetchMyBadges } from '../features/momentum/api';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemberSession } from '../hooks/useMemberSession';
import { useLanguage } from '@/contexts/LanguageContext';
import { Trophy, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

const TIER_STYLES: Record<string, { bg: string; text: string; labelKey: string }> = {
  bronze: { bg: 'bg-amber-100 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', labelKey: 'member.tierCommon' },
  silver: { bg: 'bg-slate-100 dark:bg-slate-800/30', text: 'text-slate-600 dark:text-slate-300', labelKey: 'member.tierRare' },
  gold: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', labelKey: 'member.tierEpic' },
  platinum: { bg: 'bg-violet-100 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400', labelKey: 'member.tierLegendary' },
};

const BADGE_TYPE_KEYS: Record<string, { labelKey: string; className: string }> = {
  permanent: { labelKey: 'member.typePermanent', className: 'bg-primary/10 text-primary' },
  boost: { labelKey: 'member.typeBoost', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' },
  access: { labelKey: 'member.typeAccess', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' },
  seasonal: { labelKey: 'member.typeSeasonal', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400' },
};

function getExpiryText(earnedAt: string, durationDays: number | null | undefined, t: (key: string) => string): string | null {
  if (!durationDays) return null;
  const expiresAt = new Date(earnedAt);
  expiresAt.setDate(expiresAt.getDate() + durationDays);
  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0) return t('member.badgeExpired');
  return t('member.badgeDaysLeft').replace('{{n}}', String(daysLeft));
}

function formatEffect(effectType: string | undefined, effectValue: Record<string, unknown> | undefined, t: (key: string) => string): string | null {
  if (!effectType || effectType === 'cosmetic') return null;
  const val = effectValue as Record<string, number> | undefined;
  if (effectType === 'coin_bonus') return t('member.effectCoinBonus').replace('{{amount}}', String(val?.amount ?? '?'));
  if (effectType === 'xp_bonus') return t('member.effectXpBonus').replace('{{amount}}', String(val?.amount ?? '?'));
  if (effectType === 'access') return t('member.effectAccess');
  return effectType.replace(/_/g, ' ');
}

function getTierStyle(tier?: string) {
  return TIER_STYLES[tier ?? 'bronze'] ?? TIER_STYLES.bronze;
}

export default function MemberBadgeGalleryPage() {
  const { memberId } = useMemberSession();
  const { t } = useLanguage();

  const { data: badges, isLoading } = useQuery({
    queryKey: ['my-badges', memberId],
    queryFn: () => fetchMyBadges(memberId!),
    enabled: !!memberId,
  });

  const { data: allBadges } = useQuery({
    queryKey: ['all-badges'],
    queryFn: async () => {
      const { data } = await supabase
        .from('gamification_badges')
        .select('id, name_en, description_en, tier, badge_type, icon_url, effect_type, effect_value, duration_days')
        .eq('is_active', true)
        .order('display_priority', { ascending: true });
      return data ?? [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const earnedIds = new Set((badges ?? []).map(b => b.badgeId));
  const lockedBadges = (allBadges ?? []).filter(b => !earnedIds.has(b.id));
  const earned = badges?.length ?? 0;
  const total = allBadges?.length ?? 0;

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('member.badgeCollection')} subtitle={t('member.badgeSubtitle')} />

      {/* Collection counter */}
      {!isLoading && total > 0 && (
        <div className="px-4 mb-4">
          <div className="flex items-center justify-center gap-2 rounded-xl bg-primary/5 py-2.5">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">{earned}</span>
            <span className="text-sm text-muted-foreground">/ {total} {t('member.collected')}</span>
          </div>
        </div>
      )}

      {/* Earned Badges */}
      <Section title={earned > 0 ? t('member.earned') : undefined}>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
        ) : !badges || badges.length === 0 ? (
          <EmptyState
            title={t('member.noBadgesYet')}
            description={t('member.noBadgesHint')}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {badges.map((mb, i) => {
              const style = getTierStyle(mb.badge?.tier);
              const badgeTypeInfo = BADGE_TYPE_KEYS[mb.badge?.badgeType ?? 'permanent'] ?? BADGE_TYPE_KEYS.permanent;
              const expiryText = getExpiryText(mb.earnedAt, mb.badge?.durationDays, t);
              const effectText = formatEffect(mb.badge?.effectType, mb.badge?.effectValue as Record<string, unknown> | undefined, t);

              return (
                <div
                  key={mb.id}
                  className="relative rounded-xl border bg-card p-4 shadow-sm flex flex-col items-center text-center gap-2.5 overflow-hidden"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {expiryText && (
                    <div className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-[8px] font-bold ${expiryText === t('member.badgeExpired') ? 'bg-destructive/10 text-destructive' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'}`}>
                      {expiryText}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className={`text-[8px] font-black uppercase tracking-widest rounded-full px-2 py-0.5 ${badgeTypeInfo.className}`}>
                      {badgeTypeInfo.label}
                    </span>
                    <span className={`text-[8px] font-black uppercase tracking-widest rounded-full px-2 py-0.5 ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  </div>
                  <div className={`flex h-14 w-14 items-center justify-center rounded-full ${style.bg}`}>
                    {mb.badge?.iconUrl ? (
                      <img src={mb.badge.iconUrl} alt={mb.badge.nameEn} className="h-8 w-8 drop-shadow-sm" />
                    ) : (
                      <Trophy className={`h-7 w-7 ${style.text}`} />
                    )}
                  </div>
                  <p className="text-sm font-bold text-foreground leading-tight">
                    {mb.badge?.nameEn ?? 'Badge'}
                  </p>
                  {mb.badge?.descriptionEn && (
                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                      {mb.badge.descriptionEn}
                    </p>
                  )}
                  {effectText && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                      {effectText}
                    </span>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-auto font-medium">
                    {format(new Date(mb.earnedAt), 'MMM d, yyyy')}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <Section title={t('member.locked')} className="mt-4">
          <div className="grid grid-cols-2 gap-3">
            {lockedBadges.map((badge) => {
              const style = getTierStyle(badge.tier);
              const badgeTypeInfo = BADGE_TYPE_LABELS[badge.badge_type ?? 'permanent'] ?? BADGE_TYPE_LABELS.permanent;

              return (
                <div
                  key={badge.id}
                  className="relative rounded-xl border bg-card/50 p-4 shadow-sm flex flex-col items-center text-center gap-2.5 overflow-hidden opacity-60"
                >
                  <div className="absolute top-2 right-2">
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[8px] font-black uppercase tracking-widest rounded-full px-2 py-0.5 ${badgeTypeInfo.className}`}>
                      {badgeTypeInfo.label}
                    </span>
                    <span className={`text-[8px] font-black uppercase tracking-widest rounded-full px-2 py-0.5 ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  </div>
                  <div className={`flex h-14 w-14 items-center justify-center rounded-full ${style.bg} grayscale`}>
                    {badge.icon_url ? (
                      <img src={badge.icon_url} alt={badge.name_en} className="h-8 w-8 drop-shadow-sm grayscale" />
                    ) : (
                      <Trophy className={`h-7 w-7 ${style.text}`} />
                    )}
                  </div>
                  <p className="text-sm font-bold text-foreground leading-tight">
                    {badge.name_en}
                  </p>
                  {badge.description_en && (
                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                      {badge.description_en}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}
