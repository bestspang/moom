import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { DataTable } from '@/components/common/DataTable';
import { StatCard } from '@/components/common/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Award, TrendingUp, Users } from 'lucide-react';

export default function GamificationStatusTiers() {
  const { t } = useLanguage();

  const { data: rules, isLoading: loadingRules } = useQuery({
    queryKey: ['status-tier-rules'],
    queryFn: async () => {
      const { data, error } = await supabase.from('status_tier_rules')
        .select('*')
        .order('tier_order', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: spRules, isLoading: loadingSp } = useQuery({
    queryKey: ['status-tier-sp-rules'],
    queryFn: async () => {
      const { data, error } = await supabase.from('status_tier_sp_rules')
        .select('*')
        .order('action_key');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: benefits } = useQuery({
    queryKey: ['status-tier-benefits'],
    queryFn: async () => {
      const { data, error } = await supabase.from('status_tier_benefits')
        .select('*')
        .order('tier_code, sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: distribution } = useQuery({
    queryKey: ['status-tier-distribution'],
    queryFn: async () => {
      const { data, error } = await supabase.from('member_status_tiers')
        .select('current_tier');
      if (error) return {};
      const counts: Record<string, number> = {};
      (data ?? []).forEach((r) => {
        counts[r.current_tier] = (counts[r.current_tier] || 0) + 1;
      });
      return counts;
    },
  });

  if (loadingRules || loadingSp) {
    return <div className="space-y-4"><Skeleton className="h-24" /><Skeleton className="h-64" /></div>;
  }

  const dist = (distribution ?? {}) as Record<string, number>;
  const totalMembers = Object.values(dist).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title={t('gamification.statusTiers.totalTiers')} value={rules?.length ?? 0} icon={<Shield className="h-5 w-5" />} />
        <StatCard title={t('gamification.statusTiers.spRules')} value={spRules?.length ?? 0} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard title={t('gamification.statusTiers.benefits')} value={benefits?.length ?? 0} icon={<Award className="h-5 w-5" />} />
        <StatCard title={t('gamification.statusTiers.evaluatedMembers')} value={totalMembers} icon={<Users className="h-5 w-5" />} />
      </div>

      {/* Tier Qualification Rules */}
      <div>
        <h3 className="text-sm font-bold mb-3">{t('gamification.statusTiers.qualificationRules')}</h3>
        <DataTable
          rowKey={(row: any) => row.id ?? row.tier_code}
          columns={[
            { key: 'tier_code', header: t('gamification.statusTiers.tier'), cell: (row: any) => (
              <span className="flex items-center gap-2 font-bold capitalize">
                <span>{row.icon_emoji}</span>
                {row.display_name_en}
              </span>
            )},
            { key: 'min_level', header: t('gamification.statusTiers.minLevel'), cell: (row: any) => row.min_level },
            { key: 'min_sp_90d', header: t('gamification.statusTiers.minSp90d'), cell: (row: any) => row.min_sp_90d },
            { key: 'active_days', header: t('gamification.statusTiers.activeDays'), cell: (row: any) => (
              <span>{row.min_active_days_period} in {row.active_days_window}d</span>
            )},
            { key: 'requires_pkg', header: t('gamification.statusTiers.reqPackage'), cell: (row: any) => (
              row.requires_active_package ? '✅' : '—'
            )},
            { key: 'members', header: t('gamification.statusTiers.members'), cell: (row: any) => (
              <span className="font-mono">{dist[row.tier_code] ?? 0}</span>
            )},
          ]}
          data={rules ?? []}
        />
      </div>

      {/* SP Earning Rules */}
      <div>
        <h3 className="text-sm font-bold mb-3">{t('gamification.statusTiers.spEarningRules')}</h3>
        <DataTable
          rowKey={(row: any) => row.id ?? row.action_key}
          columns={[
            { key: 'action_key', header: t('gamification.statusTiers.actionKey'), cell: (row: any) => row.action_key },
            { key: 'sp_value', header: t('gamification.statusTiers.spValue'), cell: (row: any) => row.sp_value },
            { key: 'daily_cap', header: t('gamification.statusTiers.dailyCap'), cell: (row: any) => row.daily_cap ?? '∞' },
            { key: 'is_active', header: t('common.active'), cell: (row: any) => row.is_active ? '✅' : '❌' },
          ]}
          data={spRules ?? []}
        />
      </div>

      {/* Benefits */}
      <div>
        <h3 className="text-sm font-bold mb-3">{t('gamification.statusTiers.tierBenefits')}</h3>
        <DataTable
          rowKey={(row: any) => row.id}
          columns={[
            { key: 'tier_code', header: t('gamification.statusTiers.tier'), cell: (row: any) => (
              <span className="capitalize font-medium">{row.tier_code}</span>
            )},
            { key: 'description_en', header: t('gamification.statusTiers.benefit'), cell: (row: any) => row.description_en },
            { key: 'frequency', header: t('gamification.statusTiers.frequency'), cell: (row: any) => row.frequency },
            { key: 'max_per_month', header: t('gamification.statusTiers.maxPerMonth'), cell: (row: any) => row.max_per_month ?? '∞' },
          ]}
          data={benefits ?? []}
        />
      </div>
    </div>
  );
}
