import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { StatusTierBadge, STATUS_TIER_CONFIG, type StatusTier } from './StatusTierBadge';
import { fetchMemberStatusTier } from './api';
import { Progress } from '@/components/ui/progress';
import { Shield, TrendingUp, AlertTriangle } from 'lucide-react';

interface StatusTierCardProps {
  memberId: string;
}

const TIER_ORDER: StatusTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'black'];

export function StatusTierCard({ memberId }: StatusTierCardProps) {
  const { t } = useTranslation();

  const { data: tierData, isLoading } = useQuery({
    queryKey: ['member-status-tier', memberId],
    queryFn: () => fetchMemberStatusTier(memberId),
    enabled: !!memberId,
  });

  if (isLoading || !tierData) return null;

  const currentIdx = TIER_ORDER.indexOf(tierData.currentTier as StatusTier);
  const nextTier = currentIdx < TIER_ORDER.length - 1 ? TIER_ORDER[currentIdx + 1] : null;
  const isOnGrace = tierData.graceUntil && new Date(tierData.graceUntil) > new Date();

  // Calculate progress to next tier SP requirement
  const nextTierSpReq = tierData.nextTierSp90d ?? 0;
  const progressPercent = nextTierSpReq > 0
    ? Math.min(100, Math.round((tierData.sp90d / nextTierSpReq) * 100))
    : 100;

  return (
    <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t('member.yourStatus')}
          </p>
        </div>
        <StatusTierBadge tier={tierData.currentTier as StatusTier} size="md" />
      </div>

      {/* Grace warning */}
      {isOnGrace && (
        <div className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-xs font-medium text-warning-foreground">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          {t('member.graceWarning')}
        </div>
      )}

      {/* SP Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t('member.statusPoints90d')}</span>
          <span className="font-bold text-foreground">{tierData.sp90d} SP</span>
        </div>
        {nextTier && (
          <>
            <Progress value={progressPercent} className="h-2" />
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              {t('member.spToNextTier', { sp: nextTierSpReq - tierData.sp90d, tier: STATUS_TIER_CONFIG[nextTier].label })}
            </div>
          </>
        )}
      </div>

      {/* Active days */}
      <div className="flex gap-3 text-center">
        {[
          { label: '30d', value: tierData.activeDays30d },
          { label: '60d', value: tierData.activeDays60d },
          { label: '90d', value: tierData.activeDays90d },
        ].map(d => (
          <div key={d.label} className="flex-1 rounded-lg bg-muted/50 py-1.5 px-2">
            <p className="text-sm font-bold text-foreground">{d.value}</p>
            <p className="text-[10px] text-muted-foreground">{t('member.activeDays')} ({d.label})</p>
          </div>
        ))}
      </div>

      {/* Explanation */}
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        {t('member.statusTierExplanation')}
      </p>
    </div>
  );
}
