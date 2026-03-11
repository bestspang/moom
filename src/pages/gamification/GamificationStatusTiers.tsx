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
      const { data, error } = await (supabase as any).from('status_tier_rules')
        .select('*')
        .order('tier_order', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: spRules, isLoading: loadingSp } = useQuery({
    queryKey: ['status-tier-sp-rules'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('status_tier_sp_rules')
        .select('*')
        .order('action_key');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: benefits } = useQuery({
    queryKey: ['status-tier-benefits'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('status_tier_benefits')
        .select('*')
        .order('tier_code, sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: distribution } = useQuery({
    queryKey: ['status-tier-distribution'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('member_status_tiers')
        .select('current_tier');
      if (error) return {};
      const counts: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
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
        <StatCard title="Total Tiers" value={rules?.length ?? 0} icon={<Shield className="h-5 w-5" />} />
        <StatCard title="SP Rules" value={spRules?.length ?? 0} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard title="Benefits" value={benefits?.length ?? 0} icon={<Award className="h-5 w-5" />} />
        <StatCard title="Evaluated Members" value={totalMembers} icon={<Users className="h-5 w-5" />} />
      </div>

      {/* Tier Qualification Rules */}
      <div>
        <h3 className="text-sm font-bold mb-3">Tier Qualification Rules</h3>
        <DataTable
          rowKey={(row: any) => row.id ?? row.tier_code}
          columns={[
            { key: 'tier_code', header: 'Tier', cell: (row: any) => (
              <span className="flex items-center gap-2 font-bold capitalize">
                <span>{row.icon_emoji}</span>
                {row.display_name_en}
              </span>
            )},
            { key: 'min_level', header: 'Min Level', cell: (row: any) => row.min_level },
            { key: 'min_sp_90d', header: 'Min SP (90d)', cell: (row: any) => row.min_sp_90d },
            { key: 'active_days', header: 'Active Days', cell: (row: any) => (
              <span>{row.min_active_days_period} in {row.active_days_window}d</span>
            )},
            { key: 'requires_pkg', header: 'Req. Package', cell: (row: any) => (
              row.requires_active_package ? '✅' : '—'
            )},
            { key: 'members', header: 'Members', cell: (row: any) => (
              <span className="font-mono">{dist[row.tier_code] ?? 0}</span>
            )},
          ]}
          data={rules ?? []}
        />
      </div>

      {/* SP Earning Rules */}
      <div>
        <h3 className="text-sm font-bold mb-3">Status Point Earning Rules</h3>
        <DataTable
          columns={[
            { key: 'action_key', header: 'Action Key', cell: (row: any) => row.action_key },
            { key: 'sp_value', header: 'SP Value', cell: (row: any) => row.sp_value },
            { key: 'daily_cap', header: 'Daily Cap', cell: (row: any) => row.daily_cap ?? '∞' },
            { key: 'is_active', header: 'Active', cell: (row: any) => row.is_active ? '✅' : '❌' },
          ]}
          data={spRules ?? []}
        />
      </div>

      {/* Benefits */}
      <div>
        <h3 className="text-sm font-bold mb-3">Tier Benefits</h3>
        <DataTable
          columns={[
            { key: 'tier_code', header: 'Tier', cell: (row: any) => (
              <span className="capitalize font-medium">{row.tier_code}</span>
            )},
            { key: 'description_en', header: 'Benefit', cell: (row: any) => row.description_en },
            { key: 'frequency', header: 'Frequency', cell: (row: any) => row.frequency },
            { key: 'max_per_month', header: 'Max/Month', cell: (row: any) => row.max_per_month ?? '∞' },
          ]}
          data={benefits ?? []}
        />
      </div>
    </div>
  );
}
