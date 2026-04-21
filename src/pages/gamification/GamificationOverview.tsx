import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Gift, Target, TrendingUp, Award, AlertTriangle, Plus, Users, Coins, Shield, ScrollText } from 'lucide-react';
import { useGamificationRules } from '@/hooks/useGamificationRules';
import { useGamificationChallenges } from '@/hooks/useGamificationChallenges';
import { useGamificationBadges } from '@/hooks/useGamificationBadges';
import { useGamificationRewards } from '@/hooks/useGamificationRewards';
import { useGamificationAudit } from '@/hooks/useGamificationAudit';
import { useGamificationQuests } from '@/hooks/useGamificationQuests';
import { useGamificationLevels } from '@/hooks/useGamificationLevels';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Fetch economy stats for admin overview
async function fetchEconomyStats() {
  const [profilesRes, redemptionsRes, questInstancesRes, badgeEarningsRes] = await Promise.all([
    supabase.from('member_gamification_profiles').select('total_xp, current_level, available_points, total_points', { count: 'exact' }),
    supabase.from('reward_redemptions').select('points_spent, status', { count: 'exact' }),
    supabase.from('quest_instances').select('status', { count: 'exact' }),
    supabase.from('badge_earnings').select('id', { count: 'exact' }),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (redemptionsRes.error) throw redemptionsRes.error;
  if (questInstancesRes.error) throw questInstancesRes.error;
  if (badgeEarningsRes.error) throw badgeEarningsRes.error;

  const profiles = profilesRes.data ?? [];
  const totalMembers = profilesRes.count ?? 0;
  const totalCoinInCirculation = profiles.reduce((s, p) => s + (p.available_points ?? 0), 0);
  const totalCoinEverEarned = profiles.reduce((s, p) => s + (p.total_points ?? 0), 0);
  const totalXpEarned = profiles.reduce((s, p) => s + (p.total_xp ?? 0), 0);
  const avgLevel = totalMembers > 0 ? (profiles.reduce((s, p) => s + (p.current_level ?? 1), 0) / totalMembers) : 0;

  const redemptions = redemptionsRes.data ?? [];
  const totalRedemptions = redemptionsRes.count ?? 0;
  const totalCoinSpent = redemptions.reduce((s, r) => s + (r.points_spent ?? 0), 0);

  const quests = questInstancesRes.data ?? [];
  const totalQuestsAssigned = questInstancesRes.count ?? 0;
  const questsClaimed = quests.filter(q => q.status === 'claimed').length;
  const questCompletionRate = totalQuestsAssigned > 0 ? Math.round((questsClaimed / totalQuestsAssigned) * 100) : 0;

  const totalBadgesEarned = badgeEarningsRes.count ?? 0;

  return {
    totalMembers,
    totalCoinInCirculation,
    totalCoinEverEarned,
    totalCoinSpent,
    totalXpEarned,
    avgLevel: Math.round(avgLevel * 10) / 10,
    totalRedemptions,
    totalQuestsAssigned,
    questsClaimed,
    questCompletionRate,
    totalBadgesEarned,
  };
}

const GamificationOverview = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: rules } = useGamificationRules();
  const { data: challenges } = useGamificationChallenges();
  const { data: badges } = useGamificationBadges();
  const { data: rewards } = useGamificationRewards();
  const { data: auditLog } = useGamificationAudit({ limit: 50 });
  const { data: questTemplates } = useGamificationQuests();
  const { data: levels } = useGamificationLevels();

  const { data: economyStats, isLoading: loadingEconomy } = useQuery({
    queryKey: ['admin-economy-stats'],
    queryFn: fetchEconomyStats,
    staleTime: 60_000,
  });

  const activeRules = rules?.filter(r => r.is_active).length ?? 0;
  const activeChallenges = challenges?.filter(c => c.status === 'active').length ?? 0;
  const totalBadges = badges?.length ?? 0;
  const activeRewards = rewards?.filter(r => r.is_active).length ?? 0;
  const flaggedEvents = auditLog?.filter(e => e.flagged).length ?? 0;
  const totalXpDistributed = auditLog?.reduce((sum, e) => sum + (e.xp_delta > 0 ? e.xp_delta : 0), 0) ?? 0;
  const activeQuestTemplates = questTemplates?.filter(q => q.is_active).length ?? 0;
  const activeLevels = levels?.filter(l => l.is_active).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Economy Health Stats */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Coins className="h-4 w-4 text-primary" />
          {t('gamification.overview.economyHealth')}
        </h3>
        {loadingEconomy ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Users className="h-5 w-5" />} title={t('gamification.overview.activeProfiles')} value={economyStats?.totalMembers ?? 0} color="blue" />
            <StatCard icon={<Coins className="h-5 w-5" />} title={t('gamification.overview.coinInCirculation')} value={(economyStats?.totalCoinInCirculation ?? 0).toLocaleString()} color="orange" />
            <StatCard icon={<Gift className="h-5 w-5" />} title={t('gamification.overview.totalRedemptions')} value={economyStats?.totalRedemptions ?? 0} color="teal" />
            <StatCard icon={<Target className="h-5 w-5" />} title={t('gamification.overview.questCompletion')} value={`${economyStats?.questCompletionRate ?? 0}%`} color="blue" />
          </div>
        )}
      </div>

      {/* System Config Stats */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          {t('gamification.overview.systemConfig')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard icon={<Shield className="h-5 w-5" />} title={t('gamification.overview.levels')} value={activeLevels} color="blue" />
          <StatCard icon={<Zap className="h-5 w-5" />} title={t('gamification.overview.activeRules')} value={activeRules} color="blue" />
          <StatCard icon={<ScrollText className="h-5 w-5" />} title={t('gamification.overview.questTemplates')} value={activeQuestTemplates} color="teal" />
          <StatCard icon={<Award className="h-5 w-5" />} title={t('gamification.overview.totalBadges')} value={totalBadges} color="magenta" />
          <StatCard icon={<Gift className="h-5 w-5" />} title={t('gamification.overview.activeRewards')} value={activeRewards} color="orange" />
          <StatCard icon={<AlertTriangle className="h-5 w-5" />} title={t('gamification.overview.flaggedEvents')} value={flaggedEvents} color={flaggedEvents > 0 ? 'orange' : 'gray'} />
        </div>
      </div>

      {/* Economy Detail + Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Economy breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">{t('gamification.overview.economySummary')}</CardTitle></CardHeader>
          <CardContent>
            {loadingEconomy ? (
              <Skeleton className="h-32" />
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">{t('gamification.overview.totalXpDistributed')}</span>
                  <span className="text-sm font-bold text-foreground">{(economyStats?.totalXpEarned ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">{t('gamification.overview.totalCoinEarned')}</span>
                  <span className="text-sm font-bold text-foreground">{(economyStats?.totalCoinEverEarned ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">{t('gamification.overview.totalCoinSpent')}</span>
                  <span className="text-sm font-bold text-foreground">{(economyStats?.totalCoinSpent ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">{t('gamification.overview.avgMemberLevel')}</span>
                  <span className="text-sm font-bold text-foreground">{economyStats?.avgLevel ?? 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">{t('gamification.overview.questsAssigned')}</span>
                  <span className="text-sm font-bold text-foreground">{economyStats?.totalQuestsAssigned ?? 0}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">{t('gamification.overview.badgesEarned')}</span>
                  <span className="text-sm font-bold text-foreground">{economyStats?.totalBadgesEarned ?? 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">{t('gamification.overview.recentActivity')}</CardTitle></CardHeader>
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
                      {entry.points_delta !== 0 && <span className={entry.points_delta > 0 ? 'text-primary' : 'text-destructive'}>{entry.points_delta > 0 ? '+' : ''}{entry.points_delta} Coin</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">{t('gamification.overview.quickActions')}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => navigate('/gamification/rules')}>
              <Zap className="h-3.5 w-3.5" /> {t('gamification.tabs.rules')}
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => navigate('/gamification/quests')}>
              <ScrollText className="h-3.5 w-3.5" /> {t('gamification.tabs.quests')}
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => navigate('/gamification/badges')}>
              <Award className="h-3.5 w-3.5" /> {t('gamification.tabs.badges')}
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => navigate('/gamification/rewards')}>
              <Gift className="h-3.5 w-3.5" /> {t('gamification.tabs.rewards')}
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => navigate('/gamification/levels')}>
              <Shield className="h-3.5 w-3.5" /> {t('gamification.tabs.levels')}
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => navigate('/gamification/challenges')}>
              <Target className="h-3.5 w-3.5" /> {t('gamification.tabs.challenges')}
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => navigate('/gamification/coupons')}>
              <Plus className="h-3.5 w-3.5" /> {t('gamification.tabs.coupons')}
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => navigate('/gamification/shop-rules')}>
              <Coins className="h-3.5 w-3.5" /> {t('gamification.tabs.shopRules')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GamificationOverview;
