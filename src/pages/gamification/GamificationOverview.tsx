import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/common';
import { Users, Zap, Gift, Target, TrendingUp, BarChart3 } from 'lucide-react';
import { useGamificationRules } from '@/hooks/useGamificationRules';
import { useGamificationChallenges } from '@/hooks/useGamificationChallenges';
import { useGamificationBadges } from '@/hooks/useGamificationBadges';
import { useGamificationRewards } from '@/hooks/useGamificationRewards';
import { useGamificationAudit } from '@/hooks/useGamificationAudit';
import { Skeleton } from '@/components/ui/skeleton';

const GamificationOverview = () => {
  const { t } = useLanguage();
  const { data: rules, isLoading: rulesLoading } = useGamificationRules();
  const { data: challenges } = useGamificationChallenges();
  const { data: badges } = useGamificationBadges();
  const { data: rewards } = useGamificationRewards();
  const { data: auditLog } = useGamificationAudit({ limit: 50 });

  const activeRules = rules?.filter(r => r.is_active).length ?? 0;
  const activeChallenges = challenges?.filter(c => c.status === 'active').length ?? 0;
  const totalBadges = badges?.length ?? 0;
  const activeRewards = rewards?.filter(r => r.is_active).length ?? 0;
  const flaggedEvents = auditLog?.filter(e => e.flagged).length ?? 0;
  const totalXpDistributed = auditLog?.reduce((sum, e) => sum + (e.xp_delta > 0 ? e.xp_delta : 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Zap} label={t('gamification.overview.activeRules')} value={activeRules} />
        <StatCard icon={Target} label={t('gamification.overview.activeChallenges')} value={activeChallenges} />
        <StatCard icon={Gift} label={t('gamification.overview.totalBadges')} value={totalBadges} />
        <StatCard icon={Gift} label={t('gamification.overview.activeRewards')} value={activeRewards} />
        <StatCard icon={TrendingUp} label={t('gamification.overview.xpDistributed')} value={totalXpDistributed.toLocaleString()} />
        <StatCard icon={BarChart3} label={t('gamification.overview.flaggedEvents')} value={flaggedEvents} variant={flaggedEvents > 0 ? 'warning' : 'default'} />
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t('gamification.overview.recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!auditLog?.length ? (
              <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
            ) : (
              <div className="space-y-2">
                {auditLog.slice(0, 8).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      {entry.flagged && <span className="w-2 h-2 rounded-full bg-destructive" />}
                      <span className="font-medium">{entry.event_type}</span>
                      {entry.action_key && <span className="text-muted-foreground">· {entry.action_key}</span>}
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      {entry.xp_delta !== 0 && <span className={entry.xp_delta > 0 ? 'text-accent-teal' : 'text-destructive'}>{entry.xp_delta > 0 ? '+' : ''}{entry.xp_delta} XP</span>}
                      {entry.points_delta !== 0 && <span className={entry.points_delta > 0 ? 'text-primary' : 'text-destructive'}>{entry.points_delta > 0 ? '+' : ''}{entry.points_delta} pts</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t('gamification.overview.systemStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('gamification.overview.activeRules')}</span>
                <span className="font-medium">{activeRules} / {rules?.length ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('gamification.overview.activeChallenges')}</span>
                <span className="font-medium">{activeChallenges} / {challenges?.length ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('gamification.overview.activeRewards')}</span>
                <span className="font-medium">{activeRewards} / {rewards?.length ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('gamification.overview.totalBadges')}</span>
                <span className="font-medium">{totalBadges}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GamificationOverview;
